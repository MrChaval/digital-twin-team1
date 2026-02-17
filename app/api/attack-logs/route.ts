import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { attackLogs } from '@/lib/db';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching

export async function GET() {
  try {
    const logs = await db.select().from(attackLogs).orderBy(desc(attackLogs.timestamp)).limit(50);
    return NextResponse.json(logs, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error fetching attack logs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
