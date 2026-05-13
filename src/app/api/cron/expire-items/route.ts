// Vercel Cron Job — runs daily at midnight (configure in vercel.json)
// Also callable manually: GET /api/cron/expire-items?secret=<CRON_SECRET>
//
// Marks items as "expired" if they have been open for more than EXPIRY_DAYS days.
// Add to vercel.json:
//   { "crons": [{ "path": "/api/cron/expire-items", "schedule": "0 0 * * *" }] }

import { NextResponse, NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Item from '@/models/Item';

const EXPIRY_DAYS = Number(process.env.ITEM_EXPIRY_DAYS ?? 30);

export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
    ?? new URL(request.url).searchParams.get('secret');

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectToDatabase();

  const cutoff = new Date(Date.now() - EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const result = await Item.updateMany(
    { status: 'open', date: { $lt: cutoff }, deletedAt: null },
    { $set: { status: 'expired' } }
  );

  return NextResponse.json({
    success: true,
    expired: result.modifiedCount,
    cutoff: cutoff.toISOString(),
  });
}
