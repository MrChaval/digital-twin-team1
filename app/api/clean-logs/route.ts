import { NextRequest, NextResponse } from 'next/server';
import { db, attackLogs } from '@/lib/db';
import { sql, lt, count } from 'drizzle-orm';

/**
 * GET /api/clean-logs
 * Get storage statistics for attack logs
 */
export async function GET() {
  try {
    // Get total count and date range
    const stats = await db
      .select({
        totalLogs: count(),
        oldestLog: sql<string>`MIN(${attackLogs.timestamp})`,
        newestLog: sql<string>`MAX(${attackLogs.timestamp})`,
      })
      .from(attackLogs);

    // Get counts by time period
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const periodCounts = await db
      .select({
        total: count(),
        last24h: sql<number>`COUNT(*) FILTER (WHERE ${attackLogs.timestamp} >= ${last24h})`,
        last7d: sql<number>`COUNT(*) FILTER (WHERE ${attackLogs.timestamp} >= ${last7d})`,
        last30d: sql<number>`COUNT(*) FILTER (WHERE ${attackLogs.timestamp} >= ${last30d})`,
        olderThan30d: sql<number>`COUNT(*) FILTER (WHERE ${attackLogs.timestamp} < ${last30d})`,
      })
      .from(attackLogs);

    // Estimate storage (roughly 500 bytes per log)
    const totalLogs = Number(stats[0]?.totalLogs || 0);
    const estimatedSizeMB = (totalLogs * 500) / (1024 * 1024);

    return NextResponse.json({
      totalLogs,
      estimatedSizeMB: estimatedSizeMB.toFixed(2),
      oldestLog: stats[0]?.oldestLog,
      newestLog: stats[0]?.newestLog,
      breakdown: {
        last24h: Number(periodCounts[0]?.last24h || 0),
        last7d: Number(periodCounts[0]?.last7d || 0),
        last30d: Number(periodCounts[0]?.last30d || 0),
        olderThan30d: Number(periodCounts[0]?.olderThan30d || 0),
      },
      storageRecommendation: {
        neonFreeLimit: '500 MB',
        remainingCapacityMB: (500 - estimatedSizeMB).toFixed(2),
        maxLogsEstimate: Math.floor((500 * 1024 * 1024) / 500),
      },
    });
  } catch (error) {
    console.error('Error fetching log stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch log statistics' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/clean-logs
 * Clean up old logs or specific country logs
 * Query params:
 * - retentionDays: Delete logs older than X days (1-365)
 * - country: Delete logs from specific country (e.g., "Egypt", "United States")
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const retentionDays = searchParams.get('retentionDays');
    const country = searchParams.get('country');

    // Time-based cleanup
    if (retentionDays) {
      const days = parseInt(retentionDays, 10);
      if (days < 1 || days > 365) {
        return NextResponse.json(
          { error: 'Retention days must be between 1 and 365' },
          { status: 400 }
        );
      }

      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const countResult = await db
        .select({ count: count() })
        .from(attackLogs)
        .where(lt(attackLogs.timestamp, cutoffDate));

      const logsToDelete = Number(countResult[0]?.count || 0);

      if (logsToDelete === 0) {
        return NextResponse.json({
          success: true,
          message: 'No logs older than the retention period',
          deleted: 0,
          retentionDays: days,
        });
      }

      await db.delete(attackLogs).where(lt(attackLogs.timestamp, cutoffDate));

      return NextResponse.json({
        success: true,
        message: `Deleted ${logsToDelete} logs older than ${days} days`,
        deleted: logsToDelete,
        retentionDays: days,
        estimatedSpaceFreedMB: ((logsToDelete * 500) / (1024 * 1024)).toFixed(2),
      });
    }

    // Country-based cleanup
    if (country) {
      const result = await db
        .delete(attackLogs)
        .where(sql`${attackLogs.country} = ${country}`)
        .returning();

      return NextResponse.json({
        success: true,
        message: `Deleted ${result.length} logs from ${country}`,
        deleted: result.length,
        country,
      });
    }

    // Default: clean Egypt and United States (legacy behavior)
    console.log('🧹 Starting database cleanup...');
    
    const egyptResult = await db
      .delete(attackLogs)
      .where(sql`${attackLogs.country} = 'Egypt'`)
      .returning();

    const usResult = await db
      .delete(attackLogs)
      .where(sql`${attackLogs.country} = 'United States'`)
      .returning();

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
