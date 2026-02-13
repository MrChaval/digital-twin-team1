/**
 * Session Validation Utilities
 * 
 * Created by: JaiZz
 * Date: February 13, 2026
 * Purpose: Don't blindly trust Clerk sessions - revalidate on sensitive operations
 * 
 * WHY THIS IS NEEDED:
 * - Clerk manages authentication, but doesn't know about YOUR role system
 * - User role can change in YOUR database while Clerk session is still valid
 * - User can be deleted from YOUR database but Clerk session persists
 * - Sensitive operations should require recent authentication
 * 
 * NOTE: This is a utility library - do NOT add "use server" directive
 */

import { currentUser } from "@clerk/nextjs/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { logAuditEvent, logDenied } from "./audit";
import {
  SessionValidation,
  SessionRevalidationOptions,
  FreshSessionRequirement,
  AdminVerification,
} from "./types";

// ============================================================================
// SESSION VALIDATION
// ============================================================================

/**
 * Revalidate the current session
 * 
 * This checks:
 * 1. Clerk session is valid
 * 2. User still exists in YOUR database
 * 3. User's role matches what Clerk thinks
 * 
 * @example
 * ```typescript
 * export async function sensitiveAction() {
 *   const session = await revalidateSession();
 *   
 *   if (!session.isValid) {
 *     throw new Error("Session invalid");
 *   }
 *   
 *   if (!session.isAdmin) {
 *     throw new Error("Admin required");
 *   }
 *   
 *   // Proceed with sensitive action...
 * }
 * ```
 */
export async function revalidateSession(
  options: SessionRevalidationOptions = {}
): Promise<SessionValidation> {
  try {
    // Check Clerk session
    const clerkUser = await currentUser();

    if (!clerkUser || !clerkUser.emailAddresses || clerkUser.emailAddresses.length === 0) {
      return {
        isValid: false,
        userId: -1,
        userEmail: "",
        isAdmin: false,
        sessionAge: 0,
        lastVerified: new Date(),
        requiresReauth: true,
      };
    }

    const primaryEmail =
      clerkUser.emailAddresses.find(
        (email) => email.id === clerkUser.primaryEmailAddressId
      ) || clerkUser.emailAddresses[0];

    const email = primaryEmail.emailAddress;

    // Check if user still exists in YOUR database
    const dbUser = await getCurrentUser();

    if (!dbUser) {
      // User was deleted from your database but Clerk session still valid
      await logDenied({
        userId: null,
        userEmail: email,
        action: "SESSION_REFRESH",
        resource: "system",
        metadata: {
          reason: "User not found in database",
          clerkId: clerkUser.id,
        },
      });

      return {
        isValid: false,
        userId: -1,
        userEmail: email,
        isAdmin: false,
        sessionAge: 0,
        lastVerified: new Date(),
        requiresReauth: true,
      };
    }

    // Check admin status from YOUR database
    const userIsAdmin = await isAdmin();

    // Check if admin is required
    if (options.requireAdmin && !userIsAdmin) {
      await logDenied({
        userId: dbUser.id,
        userEmail: dbUser.email,
        action: "SESSION_REFRESH",
        resource: "system",
        metadata: {
          reason: "Admin required but user is not admin",
          requiredRole: "admin",
          actualRole: dbUser.role,
        },
      });

      return {
        isValid: false,
        userId: dbUser.id,
        userEmail: dbUser.email,
        isAdmin: false,
        sessionAge: 0,
        lastVerified: new Date(),
        requiresReauth: false,
      };
    }

    // Calculate session age
    const lastSignInAt = clerkUser.lastSignInAt
      ? new Date(clerkUser.lastSignInAt)
      : new Date();
    const sessionAge = Date.now() - lastSignInAt.getTime();

    // Check if session is too old (if max age specified)
    if (options.maxAgeMinutes) {
      const maxAgeMs = options.maxAgeMinutes * 60 * 1000;
      if (sessionAge > maxAgeMs) {
        await logDenied({
          userId: dbUser.id,
          userEmail: dbUser.email,
          action: "SESSION_REFRESH",
          resource: "system",
          metadata: {
            reason: "Session too old",
            sessionAgeMinutes: Math.floor(sessionAge / 60000),
            maxAgeMinutes: options.maxAgeMinutes,
          },
        });

        return {
          isValid: false,
          userId: dbUser.id,
          userEmail: dbUser.email,
          isAdmin: userIsAdmin,
          sessionAge,
          lastVerified: new Date(),
          requiresReauth: true,
        };
      }
    }

    // Session is valid!
    return {
      isValid: true,
      userId: dbUser.id,
      userEmail: dbUser.email,
      isAdmin: userIsAdmin,
      sessionAge,
      lastVerified: new Date(),
      requiresReauth: false,
    };
  } catch (error) {
    console.error("[SESSION_REVALIDATION_ERROR]", error);

    return {
      isValid: false,
      userId: -1,
      userEmail: "",
      isAdmin: false,
      sessionAge: 0,
      lastVerified: new Date(),
      requiresReauth: true,
    };
  }
}

/**
 * Require a fresh session for sensitive operations
 * 
 * This ensures the user authenticated recently (default: 15 minutes)
 * Use for:
 * - Deleting resources
 * - Changing user roles
 * - Exporting sensitive data
 * - Modifying security settings
 * 
 * @example
 * ```typescript
 * export async function deleteProject(projectId: number) {
 *   // Require login within last 15 minutes
 *   await requireFreshSession({ 
 *     maxAgeMinutes: 15,
 *     reason: "Delete project"
 *   });
 *   
 *   // Proceed with deletion...
 * }
 * ```
 */
export async function requireFreshSession(
  requirement: FreshSessionRequirement = {
    maxAgeMinutes: 15,
    reason: "Sensitive operation",
  }
): Promise<SessionValidation> {
  const session = await revalidateSession({
    maxAgeMinutes: requirement.maxAgeMinutes,
  });

  if (!session.isValid) {
    throw new Error(
      `Re-authentication required. Please log in again to ${requirement.reason}.`
    );
  }

  if (session.requiresReauth) {
    throw new Error(
      `Your session is ${Math.floor(session.sessionAge / 60000)} minutes old. ` +
      `Please log in again to ${requirement.reason}.`
    );
  }

  return session;
}

/**
 * Require admin session with revalidation
 * 
 * This combines session revalidation with admin check
 * Use for all admin-only operations
 * 
 * @example
 * ```typescript
 * export async function createProject(data: any) {
 *   await requireAdminSession();
 *   
 *   // User is confirmed admin with valid session
 *   const project = await db.insert(projects).values(data);
 *   return project;
 * }
 * ```
 */
export async function requireAdminSession(): Promise<AdminVerification> {
  const session = await revalidateSession({ requireAdmin: true });

  if (!session.isValid) {
    throw new Error("Invalid session. Please log in again.");
  }

  if (!session.isAdmin) {
    throw new Error("Admin privileges required.");
  }

  return {
    isAdmin: true,
    user: {
      id: session.userId,
      email: session.userEmail,
      role: "admin",
    },
    verified: new Date(),
  };
}

/**
 * Require fresh admin session for critical operations
 * 
 * Combines fresh session + admin check
 * Use for destructive admin operations
 * 
 * @example
 * ```typescript
 * export async function deleteUser(userId: number) {
 *   await requireFreshAdminSession({
 *     maxAgeMinutes: 10,
 *     reason: "delete a user"
 *   });
 *   
 *   await db.delete(users).where(eq(users.id, userId));
 * }
 * ```
 */
export async function requireFreshAdminSession(
  requirement: FreshSessionRequirement = {
    maxAgeMinutes: 15,
    reason: "perform this admin action",
  }
): Promise<AdminVerification> {
  const session = await revalidateSession({
    requireAdmin: true,
    maxAgeMinutes: requirement.maxAgeMinutes,
  });

  if (!session.isValid || session.requiresReauth) {
    throw new Error(
      `Recent authentication required. Please log in again to ${requirement.reason}.`
    );
  }

  if (!session.isAdmin) {
    throw new Error("Admin privileges required.");
  }

  return {
    isAdmin: true,
    user: {
      id: session.userId,
      email: session.userEmail,
      role: "admin",
    },
    verified: new Date(),
  };
}

// ============================================================================
// SESSION INFO HELPERS
// ============================================================================

/**
 * Get session age in minutes
 * Useful for displaying "logged in 5 minutes ago"
 */
export async function getSessionAge(): Promise<number> {
  const clerkUser = await currentUser();

  if (!clerkUser || !clerkUser.lastSignInAt) {
    return 0;
  }

  const lastSignInAt = new Date(clerkUser.lastSignInAt);
  const ageMs = Date.now() - lastSignInAt.getTime();

  return Math.floor(ageMs / 60000); // Convert to minutes
}

/**
 * Check if session needs refresh
 * Returns true if session is older than specified minutes
 */
export async function needsSessionRefresh(maxAgeMinutes: number = 30): Promise<boolean> {
  const sessionAge = await getSessionAge();
  return sessionAge > maxAgeMinutes;
}

/**
 * Get session info for display
 * 
 * @example
 * ```typescript
 * const info = await getSessionInfo();
 * console.log(`Logged in as ${info.email}`);
 * console.log(`Session age: ${info.ageMinutes} minutes`);
 * console.log(`Is admin: ${info.isAdmin}`);
 * ```
 */
export async function getSessionInfo(): Promise<{
  email: string;
  isValid: boolean;
  isAdmin: boolean;
  ageMinutes: number;
  needsRefresh: boolean;
}> {
  const session = await revalidateSession();
  const ageMinutes = await getSessionAge();

  return {
    email: session.userEmail,
    isValid: session.isValid,
    isAdmin: session.isAdmin,
    ageMinutes,
    needsRefresh: ageMinutes > 30,
  };
}
