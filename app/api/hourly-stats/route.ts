import { NextResponse } from 'next/server';
import { db, attackLogs } from '@/lib/db';
import { sql, gte } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const rows = await db
      .select({
        hour: sql<number>`EXTRACT(HOUR FROM ${attackLogs.timestamp} AT TIME ZONE 'UTC')::int`,
        high: sql<number>`COUNT(CASE WHEN ${attackLogs.severity} >= 7 THEN 1 END)::int`,
        med: sql<number>`COUNT(CASE WHEN ${attackLogs.severity} >= 4 AND ${attackLogs.severity} < 7 THEN 1 END)::int`,
        low: sql<number>`COUNT(CASE WHEN ${attackLogs.severity} < 4 THEN 1 END)::int`,
      })
      .from(attackLogs)
      .where(gte(attackLogs.timestamp, cutoff))
      .groupBy(sql`EXTRACT(HOUR FROM ${attackLogs.timestamp} AT TIME ZONE 'UTC')::int`)
      .orderBy(sql`EXTRACT(HOUR FROM ${attackLogs.timestamp} AT TIME ZONE 'UTC')::int`);

    // Fill all 24 hours (0–23), defaulting missing hours to 0
    const hourMap: Record<number, { high: number; med: number; low: number }> = {};
    for (const row of rows) {
      hourMap[row.hour] = {
        high: Number(row.high),
        med: Number(row.med),
        low: Number(row.low),
      };
    }

    const data = Array.from({ length: 24 }, (_, h) => ({
      time: `${String(h).padStart(2, '0')}:00`,
      high: hourMap[h]?.high ?? 0,
      med: hourMap[h]?.med ?? 0,
      low: hourMap[h]?.low ?? 0,
    }));

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('[API hourly-stats]', err);
    return NextResponse.json(
      { error: 'Failed to fetch hourly stats' },
      { status: 500 }
    );
  }
}
