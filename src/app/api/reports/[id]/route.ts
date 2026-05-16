import { NextResponse, NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import ItemReport from '@/models/ItemReport';
import AdminLog from '@/models/AdminLog';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { isAdmin } from '@/lib/adminAuth';

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> | any }) {
  try {
    const params = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdmin(session)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body;

    if (!['pending', 'reviewed', 'dismissed'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    await connectToDatabase();

    const report = await ItemReport.findByIdAndUpdate(
      params.id,
      { status },
      { returnDocument: 'after', runValidators: true }
    );

    if (!report) {
      return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
    }

    // Log the action
    await AdminLog.create({
      adminEmail: session.user.email,
      action: status === 'reviewed' ? 'review_report' : 'dismiss_report',
      targetId: params.id,
      details: `Updated report status to ${status}`,
    });

    return NextResponse.json({ success: true, data: report });
  } catch (error: any) {
    console.error("REPORT PATCH ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
