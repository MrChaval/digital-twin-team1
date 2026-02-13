import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { attackLogs } from '@/lib/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await db.select({ count: sql<number>`count(*)` }).from(attackLogs);
    const count = result[0].count;
    return NextResponse.json({ threats: count, blocked: count });
  } catch (error) {
    console.error('Error fetching threat activity:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
