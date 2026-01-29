"use server";

import { db, subscribers, blogPosts } from "@/lib/db";
import { sql } from "drizzle-orm";

export type DatabaseTestResult = {
  success: boolean;
  message: string;
  timestamp?: string;
  counts?: {
    subscribers: number;
    blogPosts: number;
  };
  error?: string;
};

export async function checkDatabaseStatus(): Promise<DatabaseTestResult> {
  try {
    // Get the most recent createdAt timestamp from subscribers as a proxy for DB time
    const latestSubscriber = await db.select({ createdAt: subscribers.createdAt })
      .from(subscribers)
      .orderBy(sql`${subscribers.createdAt} DESC`)
      .limit(1);
    const [{ count: subscriberCount }] = await db.select({ count: sql`COUNT(*)` }).from(subscribers);
    const [{ count: blogPostCount }] = await db.select({ count: sql`COUNT(*)` }).from(blogPosts);
    return {
      success: true,
      message: "Database connection successful",
      timestamp: latestSubscriber[0]?.createdAt?.toISOString?.() || new Date().toISOString(),
      counts: {
        subscribers: Number(subscriberCount),
        blogPosts: Number(blogPostCount),
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Database connection failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}