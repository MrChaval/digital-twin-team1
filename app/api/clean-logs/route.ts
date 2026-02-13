import { NextResponse } from 'next/server';
import { db, attackLogs } from '@/lib/db';
import { sql } from 'drizzle-orm';

/**
 * DELETE /api/clean-logs
 * Removes Egypt and United States attack logs from the database
 */
export async function DELETE() {
  try {
    console.log('🧹 Starting database cleanup...');
    console.log('Target countries: Egypt, United States');

    // Delete Egypt entries
    const egyptResult = await db
      .delete(attackLogs)
      .where(sql`${attackLogs.country} = 'Egypt'`)
      .returning();

    console.log(`✅ Deleted ${egyptResult.length} Egypt entries`);

    // Delete United States entries
    const usResult = await db
      .delete(attackLogs)
      .where(sql`${attackLogs.country} = 'United States'`)
      .returning();

    console.log(`✅ Deleted ${usResult.length} United States entries`);

    // Show remaining countries
    const remaining = await db
      .select({
        country: attackLogs.country,
        city: attackLogs.city,
        count: sql<number>`count(*)::int`,
      })
      .from(attackLogs)
      .groupBy(attackLogs.country, attackLogs.city)
      .orderBy(attackLogs.country);

    const totalRemaining = remaining.reduce((sum, r) => sum + r.count, 0);

    return NextResponse.json({
      success: true,
      deleted: {
        egypt: egyptResult.length,
        unitedStates: usResult.length,
        total: egyptResult.length + usResult.length,
      },
      remaining: {
        locations: remaining,
        total: totalRemaining,
      },
      message: `Successfully deleted ${egyptResult.length + usResult.length} entries. ${totalRemaining} entries remaining.`,
    });
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
