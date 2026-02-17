import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { attackLogs } from '@/lib/db';
import { desc, gte } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching

export async function GET(request: Request) {
  try {
    // Parse time window from query params (default: 24 hours)
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24', 10);
    const limit = parseInt(searchParams.get('limit') || '500', 10);
    
    // Calculate cutoff time
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    // Fetch logs from last N hours, ordered by timestamp desc
    const logs = await db
      .select()
      .from(attackLogs)
      .where(gte(attackLogs.timestamp, cutoffTime))
      .orderBy(desc(attackLogs.timestamp))
      .limit(Math.min(limit, 1000)); // Cap at 1000 for performance
    
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
