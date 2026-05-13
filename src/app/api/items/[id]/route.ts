import { NextResponse, NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Item from '@/models/Item';
import AdminLog from '@/models/AdminLog';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { isAdmin } from '@/lib/adminAuth';

const ALLOWED_PATCH_FIELDS = new Set(['title', 'description', 'location', 'date', 'reporterPhone', 'status']);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = await params;

    const existingItem = await Item.findOne({ _id: id, deletedAt: null });
    if (!existingItem) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    const admin = isAdmin(session);
    if (!admin && existingItem.reporterEmail !== session.user.email) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const safeUpdates: Record<string, unknown> = {};
    for (const key of ALLOWED_PATCH_FIELDS) {
      if (key in body) {
        if (key === 'status' && !['open', 'resolved', 'expired'].includes(body[key])) continue;
        safeUpdates[key] = body[key];
      }
    }

    if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json({ success: false, error: 'No valid fields to update' }, { status: 400 });
    }

    const updatedItem = await Item.findByIdAndUpdate(id, safeUpdates, { new: true });

    if (admin && safeUpdates.status === 'resolved') {
      await AdminLog.create({
        adminEmail: session.user.email,
        action: 'resolve_item',
        targetId: id,
        details: `Resolved item: ${existingItem.title}`,
      });
    }

    return NextResponse.json({ success: true, data: updatedItem }, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = await params;

    const existingItem = await Item.findOne({ _id: id, deletedAt: null });
    if (!existingItem) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    const admin = isAdmin(session);
    if (!admin && existingItem.reporterEmail !== session.user.email) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await Item.findByIdAndUpdate(id, { deletedAt: new Date() });

    if (admin) {
      await AdminLog.create({
        adminEmail: session.user.email,
        action: 'delete_item',
        targetId: id,
        details: `Soft-deleted item: ${existingItem.title}`,
      });
    }

    return NextResponse.json({ success: true, data: {} }, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
