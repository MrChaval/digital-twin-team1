import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file explicitly
config({ path: resolve(__dirname, '../.env.local') });

import { db, attackLogs } from '@/lib/db';
import { sql } from 'drizzle-orm';

/**
 * Clean specific country attack logs from database
 * Removes Egypt and United States entries to clean up the map
 */
async function cleanSpecificLogs() {
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

    console.log('\n📊 Remaining entries by location:');
    remaining.forEach((row) => {
      console.log(`   ${row.city}, ${row.country}: ${row.count} entries`);
    });

    console.log(`\n✅ Cleanup complete! Total remaining: ${remaining.reduce((sum, r) => sum + r.count, 0)} entries`);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

cleanSpecificLogs();
