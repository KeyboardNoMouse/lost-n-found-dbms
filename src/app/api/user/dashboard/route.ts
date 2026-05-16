import { NextResponse, NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Item from '@/models/Item';
import Claim from '@/models/Claim';
import ItemReport from '@/models/ItemReport';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const email = session.user.email;

    // 1. Items the user reported (posted)
    const myItems = await Item.find({ reporterEmail: email, deletedAt: null }).sort({ createdAt: -1 });
    const myItemIds = myItems.map(item => item._id);

    // 2. Claims others made on the user's items
    const receivedClaims = await Claim.find({ itemId: { $in: myItemIds } })
      .populate('itemId', 'title type category')
      .sort({ createdAt: -1 });

    // 3. Claims the user made on other items
    const myClaims = await Claim.find({ claimerEmail: email })
      .populate('itemId', 'title type category')
      .sort({ createdAt: -1 });

    // 4. Reports the user submitted
    const myReports = await ItemReport.find({ reporterEmail: email })
      .populate('itemId', 'title type category')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: {
        myItems,
        receivedClaims,
        myClaims,
        myReports,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
