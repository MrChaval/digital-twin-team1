import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { attackLogs } from '@/lib/db';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logs = await db.select().from(attackLogs).orderBy(desc(attackLogs.timestamp)).limit(20);
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching attack logs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
