import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { db, attackLogs } from '@/lib/db';
import { like, desc } from 'drizzle-orm';

async function checkClientEvents() {
  try {
    console.log('Checking for CLIENT events in database...\n');
    
    // Get all CLIENT events
    const clientEvents = await db
      .select()
      .from(attackLogs)
      .where(like(attackLogs.type, 'CLIENT:%'))
      .orderBy(desc(attackLogs.timestamp))
      .limit(10);
    
    console.log(`Found ${clientEvents.length} CLIENT events:`);
    clientEvents.forEach((event, i) => {
      console.log(`\n${i + 1}. ${event.type}`);
      console.log(`   IP: ${event.ip}`);
      console.log(`   Severity: ${event.severity}`);
      console.log(`   Time: ${event.timestamp}`);
    });
    
    // Get all attackLogs for comparison
    const allEvents = await db
      .select()
      .from(attackLogs)
      .orderBy(desc(attackLogs.timestamp))
      .limit(10);
    console.log(`\n\n=== Last 10 Events in Database ===`);
    console.log(`Total: ${allEvents.length} events\n`);
    allEvents.forEach((event, i) => {
      console.log(`${i + 1}. [${event.type}] from ${event.ip} (severity: ${event.severity})`);
      console.log(`   Time: ${event.timestamp}`);
    });
    
  } catch (error) {
    console.error('Error checking database:', error);
  }
  
  process.exit(0);
}

checkClientEvents();
