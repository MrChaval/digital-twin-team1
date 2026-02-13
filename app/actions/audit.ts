"use server";

import { db, auditLogs } from "@/lib/db";
import { desc, eq, and, gte, lte, sql } from "drizzle-orm";
import { requireAdminSession } from "@/lib/security/session";
import { sanitizeError } from "@/lib/security/errors";
import { logAuditEvent } from "@/lib/security/audit";
import { getCurrentUser } from "@/lib/auth";

/**
 * Server action to fetch audit logs with filtering
 * Admin only - requires session validation
 */
export async function getAuditLogs(params?: {
  limit?: number;
  offset?: number;
  userId?: string;
  action?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  let currentUser = null;
  
  try {
    // Require admin session
    await requireAdminSession();
    
    // Get full user object for audit logging
    currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("User not found");
    }
    
    const limit = params?.limit || 50;
    const offset = params?.offset || 0;
    
    // Build query conditions
    const conditions = [];
    
    if (params?.userId) {
      conditions.push(eq(auditLogs.userId, params.userId));
    }
    
    if (params?.action) {
      conditions.push(eq(auditLogs.action, params.action));
    }
    
    if (params?.status) {
      conditions.push(eq(auditLogs.status, params.status));
    }
    
    if (params?.startDate) {
      conditions.push(gte(auditLogs.createdAt, new Date(params.startDate)));
    }
    
    if (params?.endDate) {
      conditions.push(lte(auditLogs.createdAt, new Date(params.endDate)));
    }
    
    // Fetch logs
    const logs = await db
      .select()
      .from(auditLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);
    
    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    // Log audit log access
    await logAuditEvent({
      userId: String(currentUser.clerkId),
      userEmail: currentUser.email,
      action: "VIEW_AUDIT_LOGS",
      resource: "audit_logs",
      status: "success",
      metadata: {
        filters: params,
        resultCount: logs.length,
      },
    });
    
    return {
      success: true,
      data: {
        logs,
        total: count,
        limit,
        offset,
      },
    };
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    const sanitized = sanitizeError(error, "DB_007");
    
    if (currentUser) {
      await logAuditEvent({
        userId: String(currentUser.clerkId),
        userEmail: currentUser.email,
        action: "VIEW_AUDIT_LOGS",
        resource: "audit_logs",
        status: "failed",
        metadata: { error: String(error) },
      });
    }
    
    return {
      success: false,
      error: sanitized,
    };
  }
}

/**
 * Server action to get audit log statistics
 * Admin only
 */
export async function getAuditStats() {
  let currentUser = null;
  
  try {
    currentUser = await requireAdminSession();
    
    // Total logs
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(auditLogs);
    
    // Logs by status
    const statusStats = await db
      .select({
        status: auditLogs.status,
        count: sql<number>`count(*)::int`,
      })
      .from(auditLogs)
      .groupBy(auditLogs.status);
    
    // Recent activity (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const [{ recent }] = await db
      .select({ recent: sql<number>`count(*)::int` })
      .from(auditLogs)
      .where(gte(auditLogs.createdAt, yesterday));
    
    // Top actions
    const topActions = await db
      .select({
        action: auditLogs.action,
        count: sql<number>`count(*)::int`,
      })
      .from(auditLogs)
      .groupBy(auditLogs.action)
      .orderBy(desc(sql`count(*)`))
      .limit(10);
    
    return {
      success: true,
      data: {
        total,
        recent,
        byStatus: statusStats,
        topActions,
      },
    };
  } catch (error) {
    console.error("Error fetching audit stats:", error);
    const sanitized = sanitizeError(error, "DB_008");
    return {
      success: false,
      error: sanitized,
    };
  }
}

/**
 * Server action to test audit logging
 * Creates a test log entry
 */
export async function testAuditLogging(testData: {
  action: string;
  metadata?: Record<string, any>;
}) {
  let currentUser = null;
  
  try {
    await requireAdminSession();
    
    // Get full user object
    currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("User not found");
    }
    
    // Create test audit log
    await logAuditEvent({
      userId: String(currentUser.clerkId),
      userEmail: currentUser.email,
      action: testData.action as any,
      resource: "system",
      status: "success",
      metadata: {
        isTest: true,
        ...testData.metadata,
        timestamp: new Date().toISOString(),
      },
    });
    
    return {
      success: true,
      message: "Test audit log created successfully",
    };
  } catch (error) {
    console.error("Error creating test audit log:", error);
    const sanitized = sanitizeError(error, "DB_009");
    return {
      success: false,
      error: sanitized,
    };
  }
}
