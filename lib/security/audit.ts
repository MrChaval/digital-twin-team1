/**
 * Audit Logging System
 * 
 * Created by: JaiZz
 * Date: February 13, 2026
 * Purpose: Track all sensitive operations for security compliance and forensics
 * 
 * IMPORTANT: This file requires database migration to be run first!
 * See: lib/security/migration-audit-logs.sql
 * 
 * NOTE: This is a utility library - do NOT add "use server" directive
 */

import { db } from "@/lib/db";
import { desc, eq, and, gte, lte, sql } from "drizzle-orm";
import { pgTable, serial, integer, varchar, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import {
  AuditLogInput,
  AuditLog,
  AuditLogQuery,
  AuditAction,
  AuditResource,
  AuditStatus,
} from "./types";

// ============================================================================
// DATABASE SCHEMA (Add this to lib/db.ts when integrating)
// ============================================================================

/**
 * Audit logs table schema
 * 
 * INTEGRATION NOTE: When ready, copy this schema to lib/db.ts
 * and add to the export: export { auditLogs } from "./db";
 */
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  userEmail: varchar("user_email", { length: 255 }).notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  resource: varchar("resource", { length: 100 }),
  resourceId: varchar("resource_id", { length: 100 }), // varchar to support both int and string IDs
  metadata: jsonb("metadata"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  status: varchar("status", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// AUDIT LOGGING FUNCTIONS
// ============================================================================

/**
 * Log an audit event
 * 
 * This is the main function you'll call from server actions
 * 
 * @example
 * ```typescript
 * await logAuditEvent({
 *   userId: user.id,
 *   userEmail: user.email,
 *   action: "CREATE_PROJECT",
 *   resource: "projects",
 *   resourceId: newProject.id,
 *   metadata: { title: "New Project", description: "..." },
 *   ipAddress: req.ip,
 *   userAgent: req.headers.get("user-agent"),
 *   status: "success"
 * });
 * ```
 */
export async function logAuditEvent(input: AuditLogInput): Promise<AuditLog> {
  try {
    const [auditLog] = await db
      .insert(auditLogs)
      .values({
        userId: input.userId || null,
        userEmail: input.userEmail,
        action: input.action,
        resource: input.resource || null,
        resourceId: input.resourceId ? String(input.resourceId) : null,
        metadata: input.metadata || null,
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
        status: input.status,
      })
      .returning();

    return auditLog as AuditLog;
  } catch (error) {
    // Don't throw - we don't want audit logging to break the main operation
    console.error("[AUDIT_LOG_ERROR]", {
      error: error instanceof Error ? error.message : error,
      input,
      timestamp: new Date().toISOString(),
    });

    // Return a dummy log entry so code doesn't break
    return {
      id: -1,
      userId: input.userId || null,
      userEmail: input.userEmail,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      metadata: input.metadata,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      status: input.status,
      createdAt: new Date(),
    };
  }
}

/**
 * Convenience function to log successful actions
 * 
 * @example
 * ```typescript
 * await logSuccess({
 *   userEmail: "admin@example.com",
 *   action: "CREATE_PROJECT",
 *   resource: "projects",
 *   resourceId: 123,
 *   metadata: { title: "New Project" }
 * });
 * ```
 */
export async function logSuccess(
  input: Omit<AuditLogInput, "status">
): Promise<AuditLog> {
  return logAuditEvent({ ...input, status: "success" });
}

/**
 * Convenience function to log failed actions
 * 
 * @example
 * ```typescript
 * await logFailure({
 *   userEmail: "user@example.com",
 *   action: "CREATE_PROJECT",
 *   metadata: { error: error.message }
 * });
 * ```
 */
export async function logFailure(
  input: Omit<AuditLogInput, "status">
): Promise<AuditLog> {
  return logAuditEvent({ ...input, status: "failed" });
}

/**
 * Convenience function to log denied actions (unauthorized attempts)
 * 
 * @example
 * ```typescript
 * await logDenied({
 *   userEmail: "unauthorized@example.com",
 *   action: "ACCESS_ADMIN_PANEL",
 *   metadata: { reason: "Not an admin" }
 * });
 * ```
 */
export async function logDenied(
  input: Omit<AuditLogInput, "status">
): Promise<AuditLog> {
  return logAuditEvent({ ...input, status: "denied" });
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Get audit logs with optional filters
 * Requires admin privileges - add isAdmin() check when integrating!
 * 
 * @example
 * ```typescript
 * // Get all logs for a specific user
 * const logs = await getAuditLogs({ userEmail: "admin@example.com" });
 * 
 * // Get all failed project operations
 * const failedOps = await getAuditLogs({ 
 *   resource: "projects", 
 *   status: "failed" 
 * });
 * 
 * // Get logs from the last 24 hours
 * const recentLogs = await getAuditLogs({
 *   startDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
 * });
 * ```
 */
export async function getAuditLogs(
  query: AuditLogQuery = {}
): Promise<AuditLog[]> {
  try {
    // TODO: Add admin check when integrating
    // const admin = await isAdmin();
    // if (!admin) throw new Error("Unauthorized");

    const conditions = [];

    if (query.userId) {
      conditions.push(eq(auditLogs.userId, query.userId));
    }

    if (query.userEmail) {
      conditions.push(eq(auditLogs.userEmail, query.userEmail));
    }

    if (query.action) {
      conditions.push(eq(auditLogs.action, query.action));
    }

    if (query.resource) {
      conditions.push(eq(auditLogs.resource, query.resource));
    }

    if (query.status) {
      conditions.push(eq(auditLogs.status, query.status));
    }

    if (query.startDate) {
      conditions.push(gte(auditLogs.createdAt, query.startDate));
    }

    if (query.endDate) {
      conditions.push(lte(auditLogs.createdAt, query.endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const logs = await db
      .select()
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(query.limit || 100)
      .offset(query.offset || 0);

    return logs as AuditLog[];
  } catch (error) {
    console.error("[GET_AUDIT_LOGS_ERROR]", error);
    throw new Error("Failed to fetch audit logs");
  }
}

/**
 * Get audit logs for a specific user
 */
export async function getUserAuditLogs(
  userEmail: string,
  limit: number = 50
): Promise<AuditLog[]> {
  return getAuditLogs({ userEmail, limit });
}

/**
 * Get recent audit logs (last 100 by default)
 */
export async function getRecentAuditLogs(limit: number = 100): Promise<AuditLog[]> {
  return getAuditLogs({ limit });
}

/**
 * Get failed operations for security monitoring
 */
export async function getFailedOperations(limit: number = 50): Promise<AuditLog[]> {
  return getAuditLogs({ status: "failed", limit });
}

/**
 * Get denied operations (unauthorized attempts)
 */
export async function getDeniedOperations(limit: number = 50): Promise<AuditLog[]> {
  return getAuditLogs({ status: "denied", limit });
}

/**
 * Get audit statistics (for admin dashboard)
 * 
 * @example
 * ```typescript
 * const stats = await getAuditStatistics();
 * // Returns: { total: 1523, success: 1450, failed: 50, denied: 23 }
 * ```
 */
export async function getAuditStatistics() {
  try {
    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        success: sql<number>`count(*) filter (where status = 'success')::int`,
        failed: sql<number>`count(*) filter (where status = 'failed')::int`,
        denied: sql<number>`count(*) filter (where status = 'denied')::int`,
      })
      .from(auditLogs);

    return stats;
  } catch (error) {
    console.error("[GET_AUDIT_STATS_ERROR]", error);
    return { total: 0, success: 0, failed: 0, denied: 0 };
  }
}

/**
 * Get audit logs for a specific resource
 * Useful for seeing history of a specific project/user
 * 
 * @example
 * ```typescript
 * // Get all changes to project #5
 * const projectHistory = await getResourceAuditLogs("projects", "5");
 * ```
 */
export async function getResourceAuditLogs(
  resource: AuditResource,
  resourceId: string | number,
  limit: number = 50
): Promise<AuditLog[]> {
  return getAuditLogs({ resource, limit });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create audit metadata from request headers
 * Extracts IP and User-Agent from request
 * 
 * @example
 * ```typescript
 * import { headers } from "next/headers";
 * 
 * const auditMeta = getRequestAuditMetadata();
 * await logAuditEvent({
 *   ...auditMeta,
 *   action: "CREATE_PROJECT",
 *   // ... other fields
 * });
 * ```
 */
export async function getRequestAuditMetadata(): Promise<{
  ipAddress: string | null;
  userAgent: string | null;
}> {
  try {
    const { headers } = await import("next/headers");
    const headersList = await headers();

    return {
      ipAddress:
        headersList.get("x-forwarded-for") ||
        headersList.get("x-real-ip") ||
        null,
      userAgent: headersList.get("user-agent") || null,
    };
  } catch (error) {
    return {
      ipAddress: null,
      userAgent: null,
    };
  }
}
