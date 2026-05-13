import { NextResponse, NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Item from '@/models/Item';
import Claim from '@/models/Claim';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { validateClaimInput } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rateLimit';
import { sendClaimNotification } from '@/lib/notify';

// GET /api/claims?itemId=xxx — only item owner can see claims on their item
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    if (!itemId) {
      return NextResponse.json({ success: false, error: 'itemId is required' }, { status: 400 });
    }

    await connectToDatabase();

    const item = await Item.findOne({ _id: itemId, deletedAt: null });
    if (!item) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    if (item.reporterEmail !== session.user.email) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const claims = await Claim.find({ itemId }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: claims }, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST /api/claims — submit a claim on a found/lost item
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: 10 claims per hour per user
    const rl = checkRateLimit(`claim:${session.user.email}`, { windowMs: 60 * 60_000, max: 10 });
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many claims submitted. Try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const errors = validateClaimInput(body);
    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 422 });
    }

    const { itemId, message } = body;
    if (!itemId) {
      return NextResponse.json({ success: false, error: 'itemId is required' }, { status: 400 });
    }

    await connectToDatabase();

    const item = await Item.findOne({ _id: itemId, status: 'open', deletedAt: null });
    if (!item) {
      return NextResponse.json({ success: false, error: 'Item not found or already resolved' }, { status: 404 });
    }

    if (item.reporterEmail === session.user.email) {
      return NextResponse.json({ success: false, error: 'You cannot claim your own item' }, { status: 400 });
    }

    const claim = await Claim.findOneAndUpdate(
      { itemId, claimerEmail: session.user.email },
      {
        claimerName: session.user.name ?? 'Unknown',
        message: String(message).trim(),
        status: 'pending',
      },
      { upsert: true, new: true }
    );

    // Send email notification to item owner (non-fatal if it fails)
    try {
      await sendClaimNotification({
        ownerEmail:   item.reporterEmail,
        ownerName:    item.reporterName,
        itemTitle:    item.title,
        claimerName:  session.user.name ?? 'Unknown',
        claimerEmail: session.user.email,
        message:      String(message).trim(),
        itemId,
      });
    } catch (notifyErr) {
      console.error('[claims] notification failed:', notifyErr);
    }

    return NextResponse.json({ success: true, data: claim }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
