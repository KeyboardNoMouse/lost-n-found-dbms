import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Item from '@/models/Item';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { v2 as cloudinary } from 'cloudinary';
import { validateItemInput } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rateLimit';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const PAGE_SIZE = 12;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Fields exposed to unauthenticated users — email & phone are excluded
const PUBLIC_PROJECTION = {
  title: 1, description: 1, type: 1, category: 1,
  location: 1, date: 1, imageUrl: 1, reporterName: 1,
  status: 1, createdAt: 1,
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type          = searchParams.get('type');
    const category      = searchParams.get('category');
    const search        = searchParams.get('search');
    const sortParam     = searchParams.get('sort') ?? 'newest';
    const page          = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const reporterEmail = searchParams.get('reporterEmail');

    // Only authenticated users may query by reporterEmail (their own history)
    const session = await getServerSession(authOptions);
    const isOwnerQuery = !!(reporterEmail && session?.user?.email === reporterEmail);

    const query: Record<string, unknown> = { deletedAt: null };

    if (isOwnerQuery) {
      query.reporterEmail = reporterEmail;
    } else {
      query.status = 'open';
      if (type && ['lost', 'found'].includes(type)) query.type = type;
      if (category) query.category = category;
      if (search) query.$text = { $search: search };
    }

    // Sort order
    let sortOrder: Record<string, unknown> = { date: -1 };
    if (search) {
      sortOrder = { score: { $meta: 'textScore' }, date: -1 };
    } else if (sortParam === 'oldest') {
      sortOrder = { date: 1 };
    }

    await connectToDatabase();

    const [items, total] = await Promise.all([
      Item.find(query, isOwnerQuery ? undefined : PUBLIC_PROJECTION)
        .sort(sortOrder)
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .lean(),
      Item.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: items,
      pagination: { page, pageSize: PAGE_SIZE, total, totalPages: Math.ceil(total / PAGE_SIZE) },
    }, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: 5 reports per minute per user
    const rl = checkRateLimit(`post:${session.user.email}`, { windowMs: 60_000, max: 5 });
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait before submitting again.' },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const rawData = {
      title:       formData.get('title'),
      description: formData.get('description'),
      type:        formData.get('type'),
      category:    formData.get('category'),
      location:    formData.get('location'),
      date:        formData.get('date'),
      phone:       formData.get('phone'),
    };

    const errors = validateItemInput(rawData as Record<string, unknown>);
    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 422 });
    }

    const image = formData.get('image') as File | null;

    // Image validation: size + MIME type
    if (image && image.size > 0) {
      if (image.size > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { success: false, error: 'Image must be smaller than 5 MB' },
          { status: 400 }
        );
      }
      if (!ALLOWED_MIME_TYPES.includes(image.type)) {
        return NextResponse.json(
          { success: false, error: 'Only JPEG, PNG, WebP and GIF images are allowed' },
          { status: 400 }
        );
      }
    }

    await connectToDatabase();

    let imageUrl = '';
    if (image && image.size > 0) {
      const buffer = Buffer.from(await image.arrayBuffer());
      try {
        imageUrl = await new Promise<string>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'nielostnfound', moderation: 'aws_rek' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result?.secure_url ?? '');
            }
          );
          uploadStream.end(buffer);
        });
      } catch (err) {
        console.error('Cloudinary upload failed:', err);
        // Non-fatal — item is created without image
      }
    }

    const newItem = await Item.create({
      title:         String(rawData.title).trim(),
      description:   String(rawData.description).trim(),
      type:          rawData.type,
      category:      rawData.category,
      location:      String(rawData.location).trim(),
      date:          new Date(String(rawData.date)),
      imageUrl,
      reporterEmail: session.user.email,
      reporterName:  session.user.name ?? 'Unknown',
      reporterPhone: rawData.phone ? String(rawData.phone).trim() : undefined,
      status:        'open',
    });

    return NextResponse.json({ success: true, data: newItem }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
