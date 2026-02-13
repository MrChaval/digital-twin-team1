/**
 * Example: How to Update Server Actions with Security Features
 * 
 * Created by: JaiZz
 * Date: February 13, 2026
 * 
 * This file shows BEFORE and AFTER examples of integrating:
 * - Audit logging
 * - Session validation
 * - Error sanitization
 * 
 * DO NOT import this file - it's for reference only!
 */

"use server";

import { db, projects, users } from "@/lib/db";
import { isAdmin, getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

// Import security utilities (when integrating)
import { logSuccess, logFailure, logDenied, getRequestAuditMetadata } from "@/lib/security/audit";
import { requireAdminSession, requireFreshAdminSession } from "@/lib/security/session";
import { sanitizeError, createErrorResponseWithAudit, safeDbOperation } from "@/lib/security/errors";

// ============================================================================
// EXAMPLE 1: CREATE PROJECT
// ============================================================================

/**
 * ❌ BEFORE: No audit logging, weak error handling
 */
async function createProject_BEFORE(data: any) {
  try {
    const userIsAdmin = await isAdmin();
    
    if (!userIsAdmin) {
      return {
        success: false,
        message: "Unauthorized. Only admins can create projects.",
      };
    }

    const project = await db.insert(projects).values(data).returning();

    revalidatePath("/projects");

    return {
      success: true,
      message: "Project created successfully!",
      project: project[0],
    };
  } catch (error) {
    console.error("Error creating project:", error);
    
    // ❌ BAD: Exposes internal details
    return {
      success: false,
      message: "Failed to create project in database.",
    };
  }
}

/**
 * ✅ AFTER: With audit logging, session validation, error sanitization
 */
async function createProject_AFTER(data: any) {
  try {
    // ✅ Revalidate session (checks user still exists, still admin)
    const { user } = await requireAdminSession();
    if (!user) throw new Error("User not found");
    
    // ✅ Get request metadata for audit log
    const { ipAddress, userAgent } = await getRequestAuditMetadata();

    // ✅ Create project
    const project = await db.insert(projects).values(data).returning();

    // ✅ Log successful action
    await logSuccess({
      userId: user.id.toString(),
      userEmail: user.email,
      action: "CREATE_PROJECT",
      resource: "projects",
      resourceId: project[0].id,
      metadata: {
        title: data.title,
        description: data.description,
      },
      ipAddress,
      userAgent,
    });

    revalidatePath("/projects");

    return {
      success: true,
      message: "Project created successfully!",
      project: project[0],
    };
  } catch (error) {
    // ✅ Get user info for error logging
    const user = await getCurrentUser();

    // ✅ Sanitize error with audit logging
    return await createErrorResponseWithAudit(error, {
      code: "PROJ_001",
      userEmail: user?.email || "unknown",
      action: "CREATE_PROJECT",
      category: "VALIDATION",
      severity: "medium",
      context: { projectData: data },
    });
  }
}

// ============================================================================
// EXAMPLE 2: DELETE PROJECT (Requires fresh session)
// ============================================================================

/**
 * ❌ BEFORE: No session freshness check, no audit trail
 */
async function deleteProject_BEFORE(projectId: number) {
  try {
    const userIsAdmin = await isAdmin();
    
    if (!userIsAdmin) {
      return { success: false, message: "Unauthorized" };
    }

    await db.delete(projects).where(eq(projects.id, projectId));

    return { success: true, message: "Project deleted" };
  } catch (error) {
    return { success: false, message: "Failed to delete project" };
  }
}

/**
 * ✅ AFTER: Fresh session required (logged in within 10 minutes)
 */
async function deleteProject_AFTER(projectId: number) {
  try {
    // ✅ Require recent login for destructive action
    const { user } = await requireFreshAdminSession({
      maxAgeMinutes: 10,
      reason: "delete a project",
    });
    if (!user) throw new Error("User not found");

    const { ipAddress, userAgent } = await getRequestAuditMetadata();

    // Get project details before deletion (for audit log)
    const [projectToDelete] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));

    if (!projectToDelete) {
      await logFailure({
        userId: user.id.toString(),
        userEmail: user.email,
        action: "DELETE_PROJECT",
        resource: "projects",
        resourceId: projectId,
        metadata: { reason: "Project not found" },
        ipAddress,
        userAgent,
      });

      return {
        success: false,
        error: { message: "Project not found", code: "PROJ_003" },
      };
    }

    // ✅ Delete project
    await db.delete(projects).where(eq(projects.id, projectId));

    // ✅ Log deletion with full context
    await logSuccess({
      userId: user.id.toString(),
      userEmail: user.email,
      action: "DELETE_PROJECT",
      resource: "projects",
      resourceId: projectId,
      metadata: {
        deletedProject: projectToDelete,
      },
      ipAddress,
      userAgent,
    });

    revalidatePath("/projects");

    return { success: true, message: "Project deleted successfully" };
  } catch (error) {
    const user = await getCurrentUser();

    return await createErrorResponseWithAudit(error, {
      code: "PROJ_004",
      userEmail: user?.email || "unknown",
      action: "DELETE_PROJECT",
      category: "VALIDATION",
      severity: "high",
      context: { projectId },
    });
  }
}

// ============================================================================
// EXAMPLE 3: GET PROJECTS (Add authentication)
// ============================================================================

/**
 * ❌ BEFORE: No authentication check (anyone can access)
 */
async function getProjects_BEFORE() {
  try {
    const allProjects = await db.select().from(projects);
    return allProjects;
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw new Error("Failed to fetch projects due to data parsing or DB error.");
  }
}

/**
 * ✅ AFTER: With authentication and safe error handling
 */
async function getProjects_AFTER() {
  try {
    // ✅ Require authentication
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error("Authentication required");
    }

    // ✅ Use safe database operation wrapper
    return await safeDbOperation(
      async () => {
        return await db.select().from(projects);
      },
      "DB_003",
      "Failed to fetch projects"
    );
  } catch (error) {
    // ✅ Sanitize error (no internal details exposed)
    const sanitized = sanitizeError(error, "PROJ_003");
    
    return {
      success: false,
      error: sanitized,
    };
  }
}

// ============================================================================
// EXAMPLE 4: SET USER ROLE (Session + Audit + Error handling)
// ============================================================================

/**
 * ❌ BEFORE: Basic admin check, no audit trail
 */
async function setUserRole_BEFORE(email: string, role: string) {
  try {
    const userIsAdmin = await isAdmin();
    
    if (!userIsAdmin) {
      return { success: false, message: "Unauthorized" };
    }

    await db.update(users).set({ role }).where(eq(users.email, email));

    return { success: true, message: `User role updated to ${role}` };
  } catch (error) {
    return { success: false, message: "Failed to set user role" };
  }
}

/**
 * ✅ AFTER: Full Zero Trust implementation
 */
async function setUserRole_AFTER(email: string, role: "admin" | "user") {
  try {
    // ✅ Require fresh admin session (logged in within 15 min)
    const { user: adminUser } = await requireFreshAdminSession({
      maxAgeMinutes: 15,
      reason: "change user roles",
    });

    if (!adminUser) {
      return {
        success: false,
        error: { message: "Unauthorized", code: "AUTH_001" },
      };
    }

    const { ipAddress, userAgent } = await getRequestAuditMetadata();

    // ✅ Check if target user exists
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (!targetUser) {
      await logFailure({
        userId: adminUser.id.toString(),
        userEmail: adminUser.email,
        action: "UPDATE_USER_ROLE",
        resource: "users",
        metadata: {
          targetEmail: email,
          newRole: role,
          reason: "User not found",
        },
        ipAddress,
        userAgent,
      });

      return {
        success: false,
        error: { message: "User not found", code: "USER_003" },
      };
    }

    // ✅ Update role
    await db.update(users).set({ role }).where(eq(users.email, email));

    // ✅ Log role change with full context
    await logSuccess({
      userId: adminUser.id.toString(),
      userEmail: adminUser.email,
      action: "UPDATE_USER_ROLE",
      resource: "users",
      resourceId: targetUser.id,
      metadata: {
        targetEmail: email,
        previousRole: targetUser.role,
        newRole: role,
      },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: `User role updated to ${role}`,
    };
  } catch (error) {
    const adminUser = await getCurrentUser();

    return await createErrorResponseWithAudit(error, {
      code: "USER_002",
      userEmail: adminUser?.email || "unknown",
      action: "UPDATE_USER_ROLE",
      category: "VALIDATION",
      severity: "high",
      context: { targetEmail: email, newRole: role },
    });
  }
}

// ============================================================================
// KEY TAKEAWAYS
// ============================================================================

/**
 * When integrating these security features:
 * 
 * 1. AUDIT LOGGING:
 *    - Use logSuccess() for successful operations
 *    - Use logFailure() for failed operations
 *    - Use logDenied() for unauthorized attempts
 *    - Include metadata (what changed, previous values)
 *    - Add IP address and User-Agent for forensics
 * 
 * 2. SESSION VALIDATION:
 *    - Use requireAdminSession() for admin operations
 *    - Use requireFreshAdminSession() for destructive operations
 *    - Use revalidateSession() for custom validation logic
 *    - Check session freshness based on operation sensitivity
 * 
 * 3. ERROR HANDLING:
 *    - Use sanitizeError() to hide internal details
 *    - Use createErrorResponseWithAudit() for automatic audit logging
 *    - Use safeDbOperation() for database queries
 *    - Always include error codes for debugging
 *    - Log full errors server-side, return generic messages to clients
 * 
 * 4. BEST PRACTICES:
 *    - More sensitive = fresher session required
 *    - More sensitive = more detailed audit log
 *    - Always log before AND after operations
 *    - Log failures and denials for security monitoring
 *    - Never expose database/system details to clients
 */
