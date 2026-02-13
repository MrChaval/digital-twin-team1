/**
 * Example: Complete Admin Action with All Security Features
 * 
 * This is a real-world example showing how to implement a complete
 * admin action with all Zero Trust security features integrated.
 * 
 * Use this as a template for your own admin actions.
 */

"use server";

import { db, projects } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

// Import security utilities
import {
  logSuccess,
  logFailure,
  logDenied,
  getRequestAuditMetadata,
} from "@/lib/security/audit";
import { requireAdminSession } from "@/lib/security/session";
import { createErrorResponseWithAudit } from "@/lib/security/errors";
import { getCurrentUser } from "@/lib/auth";

// Type for the response
interface UpdateProjectResponse {
  success: boolean;
  message?: string;
  project?: any;
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * Update project - Complete implementation with all security features
 * 
 * Security features implemented:
 * ✅ Session revalidation
 * ✅ Admin authorization check
 * ✅ Audit logging (success, failure, denied)
 * ✅ Error sanitization
 * ✅ Request metadata capture (IP, User-Agent)
 * ✅ Pre and post operation logging
 * 
 * @param projectId - ID of project to update
 * @param data - Updated project data
 * @returns Response with success status and sanitized error if any
 */
export async function updateProject(
  projectId: number,
  data: { title?: string; description?: string; icon?: string; items?: string[] }
): Promise<UpdateProjectResponse> {
  try {
    // ============================================================================
    // STEP 1: Validate session and authorization
    // ============================================================================
    
    // Revalidate session - ensures:
    // - User still exists in database
    // - User is still an admin
    // - Session hasn't been revoked
    const { user } = await requireAdminSession();

    // Get request metadata for audit logging
    const { ipAddress, userAgent } = await getRequestAuditMetadata();

    // ============================================================================
    // STEP 2: Validate input and check if resource exists
    // ============================================================================

    // Check if project exists
    const [existingProject] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!existingProject) {
      // Log failed attempt (project not found)
      await logFailure({
        userId: user.id,
        userEmail: user.email,
        action: "UPDATE_PROJECT",
        resource: "projects",
        resourceId: projectId,
        metadata: {
          reason: "Project not found",
          attemptedUpdate: data,
        },
        ipAddress,
        userAgent,
      });

      return {
        success: false,
        error: {
          message: "Project not found.",
          code: "PROJ_003",
        },
      };
    }

    // ============================================================================
    // STEP 3: Perform the operation
    // ============================================================================

    // Update project in database
    const [updatedProject] = await db
      .update(projects)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))
      .returning();

    // ============================================================================
    // STEP 4: Log successful operation
    // ============================================================================

    // Log with full context - helps with forensics and debugging
    await logSuccess({
      userId: user.id,
      userEmail: user.email,
      action: "UPDATE_PROJECT",
      resource: "projects",
      resourceId: projectId,
      metadata: {
        // Log what changed
        changes: data,
        // Log previous values for rollback capability
        previousValues: {
          title: existingProject.title,
          description: existingProject.description,
          icon: existingProject.icon,
          items: existingProject.items,
        },
        // Log new values
        newValues: updatedProject,
      },
      ipAddress,
      userAgent,
    });

    // ============================================================================
    // STEP 5: Revalidate cache and return success
    // ============================================================================

    revalidatePath("/projects");

    return {
      success: true,
      message: "Project updated successfully!",
      project: updatedProject,
    };

  } catch (error) {
    // ============================================================================
    // ERROR HANDLING: Sanitize and log
    // ============================================================================

    // Get current user (might be different from session if session expired)
    const currentUser = await getCurrentUser();

    // If error was authorization-related, log as denied
    if (
      error instanceof Error &&
      (error.message.includes("Admin") ||
       error.message.includes("Unauthorized") ||
       error.message.includes("permission"))
    ) {
      const { ipAddress, userAgent } = await getRequestAuditMetadata();

      await logDenied({
        userId: currentUser?.id,
        userEmail: currentUser?.email || "unknown",
        action: "UPDATE_PROJECT",
        resource: "projects",
        resourceId: projectId,
        metadata: {
          reason: error.message,
          attemptedUpdate: data,
        },
        ipAddress,
        userAgent,
      });
    }

    // Return sanitized error with audit logging
    return await createErrorResponseWithAudit(error, {
      code: "PROJ_002",
      userEmail: currentUser?.email || "unknown",
      action: "UPDATE_PROJECT",
      category: "VALIDATION",
      severity: "medium",
      context: {
        projectId,
        updateData: data,
      },
    });
  }
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * How to call this from a component:
 * 
 * ```typescript
 * // In a React Server Component or Client Component with useActionState
 * 
 * import { updateProject } from "@/app/actions/projects";
 * 
 * async function handleUpdateProject(formData: FormData) {
 *   const projectId = Number(formData.get("projectId"));
 *   const title = formData.get("title") as string;
 *   const description = formData.get("description") as string;
 *   
 *   const result = await updateProject(projectId, {
 *     title,
 *     description
 *   });
 *   
 *   if (result.success) {
 *     // Show success toast
 *     toast.success(result.message);
 *   } else {
 *     // Show error toast with generic message
 *     toast.error(result.error?.message);
 *     // Error details logged server-side with code: result.error?.code
 *   }
 * }
 * ```
 */

// ============================================================================
// WHAT YOU CAN SEE IN AUDIT LOGS
// ============================================================================

/**
 * After running this action, you'll have a complete audit trail:
 * 
 * SUCCESS LOG:
 * {
 *   id: 123,
 *   userId: 1,
 *   userEmail: "admin@example.com",
 *   action: "UPDATE_PROJECT",
 *   resource: "projects",
 *   resourceId: "5",
 *   metadata: {
 *     changes: { title: "New Title" },
 *     previousValues: { title: "Old Title", ... },
 *     newValues: { title: "New Title", ... }
 *   },
 *   ipAddress: "192.168.1.100",
 *   userAgent: "Mozilla/5.0...",
 *   status: "success",
 *   createdAt: "2026-02-13T10:30:00Z"
 * }
 * 
 * FAILED LOG (if project not found):
 * {
 *   id: 124,
 *   userId: 1,
 *   userEmail: "admin@example.com",
 *   action: "UPDATE_PROJECT",
 *   resource: "projects",
 *   resourceId: "999",
 *   metadata: {
 *     reason: "Project not found",
 *     attemptedUpdate: { title: "New Title" }
 *   },
 *   ipAddress: "192.168.1.100",
 *   userAgent: "Mozilla/5.0...",
 *   status: "failed",
 *   createdAt: "2026-02-13T10:31:00Z"
 * }
 * 
 * DENIED LOG (if non-admin tries):
 * {
 *   id: 125,
 *   userId: 2,
 *   userEmail: "user@example.com",
 *   action: "UPDATE_PROJECT",
 *   resource: "projects",
 *   resourceId: "5",
 *   metadata: {
 *     reason: "Admin privileges required",
 *     attemptedUpdate: { title: "Hacked!" }
 *   },
 *   ipAddress: "185.220.101.50",
 *   userAgent: "curl/7.68.0",
 *   status: "denied",
 *   createdAt: "2026-02-13T10:32:00Z"
 * }
 */

// ============================================================================
// RECRUITER TALKING POINTS
// ============================================================================

/**
 * When showing this to recruiters, highlight:
 * 
 * 1. "Every admin action is tracked - who, what, when, where"
 * 2. "Session revalidation prevents stale permissions"
 * 3. "Error messages to users are generic - internal details never exposed"
 * 4. "Complete forensic trail - can investigate any security incident"
 * 5. "Zero Trust: never trust session alone, always revalidate"
 * 6. "Can prove compliance with SOC2, ISO 27001, GDPR requirements"
 */
