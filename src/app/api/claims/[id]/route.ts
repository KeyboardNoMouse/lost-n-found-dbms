import { NextResponse, NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Claim from '@/models/Claim';
import Item from '@/models/Item';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> | any }) {
  try {
    const params = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    if (!['accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status. Must be accepted or rejected' }, { status: 400 });
    }

    await connectToDatabase();

    const claim = await Claim.findById(params.id).populate('itemId');
    if (!claim) {
      return NextResponse.json({ success: false, error: 'Claim not found' }, { status: 404 });
    }

    // Verify the current user is the owner of the item
    const item = claim.itemId as any;
    if (item.reporterEmail !== session.user.email) {
      return NextResponse.json({ success: false, error: 'Forbidden: You do not own this item' }, { status: 403 });
    }

    claim.status = status;
    await claim.save();

    // Optionally, if the claim is accepted, we could also mark the item as resolved
    if (status === 'accepted') {
      item.status = 'resolved';
      await item.save();
    }

    return NextResponse.json({ success: true, data: claim });
  } catch (error: any) {
    console.error("CLAIM PATCH ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
