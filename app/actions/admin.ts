"use server";

import { isAdmin, getCurrentUser } from "@/lib/auth";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { User, ActionState } from "@/lib/types";
import { logAuditEvent } from "@/lib/security/audit";
import { requireAdminSession } from "@/lib/security/session";
import { sanitizeError, createErrorResponse } from "@/lib/security/errors";
import { headers } from "next/headers";

/**
 * Server action to check if the current user has admin privileges.
 * 
 * This function verifies if the authenticated user has administrator role
 * by calling the isAdmin() helper function from the auth library.
 * 
 * @returns {Promise<ActionState & {data?: {isAdmin: boolean}}>} An object containing:
 *   - status: "success" or "error" indicating the operation result
 *   - message: A description of the operation outcome
 *   - data: (on success) An object with the isAdmin boolean flag
 * 
 * Used with useActionState hook in React 19 components to manage admin status.
 */
export async function checkAdminStatus(): Promise<ActionState & {data?: {isAdmin: boolean}}> {
  try {
    const userIsAdmin = await isAdmin();
    const user = await getCurrentUser();
    
    // Log admin status check (low-risk operation)
    if (user) {
      await logAuditEvent({
        userId: user.clerkId,
        userEmail: user.email,
        action: "ADMIN_STATUS_CHECK",
        resourceType: "system",
        status: "success",
        metadata: { isAdmin: userIsAdmin }
      });
    }
    
    return { 
      status: "success" as const,
      message: "Admin status checked successfully",
      data: { isAdmin: userIsAdmin }
    };
  } catch (error) {
    console.error("Error checking admin status:", error);
    const sanitized = sanitizeError(error, "AUTH_002");
    return { 
      status: "error" as const,
      message: sanitized.publicMessage
    };
  }
}

/**
 * Server action to get the current authenticated user with role information.
 * 
 * This function retrieves the currently authenticated user, including their
 * role and permissions by calling the getCurrentUser() helper function.
 * 
 * @returns {Promise<ActionState & {data?: {user: User | null}}>} An object containing:
 *   - status: "success" or "error" indicating the operation result
 *   - message: A description of the operation outcome
 *   - data: (on success) An object with the user information or null if not authenticated
 *        The User type includes: id, email, name, role, clerkId, and timestamps
 * 
 * Used with useActionState hook in React 19 components to display current user data
 * and conditionally render UI elements based on authentication status.
 */
export async function getUser(): Promise<ActionState & {data?: {user: User | null}}> {
  try {
    const user = await getCurrentUser();
    
    // Log user retrieval (low-risk operation)
    if (user) {
      await logAuditEvent({
        userId: user.clerkId,
        userEmail: user.email,
        action: "USER_INFO_READ",
        resourceType: "user",
        resourceId: user.id.toString(),
        status: "success"
      });
    }
    
    return { 
      status: "success" as const,
      message: "User retrieved successfully",
      data: { user }
    };
  } catch (error) {
    console.error("Error getting user:", error);
    const sanitized = sanitizeError(error, "AUTH_003");
    return { 
      status: "error" as const,
      message: sanitized.publicMessage
    };
  }
}

/**
 * Server action to get all users with their roles from the database.
 * 
 * This function retrieves a list of all registered users, ordered by creation date.
 * Access is restricted to administrators only. Authentication and authorization checks
 * are performed before data retrieval.
 * 
 * @returns {Promise<ActionState & {data?: {users: User[]}}>} An object containing:
 *   - status: "success" or "error" indicating the operation result
 *   - message: A description of the operation outcome or error reason
 *   - data: (on success) An object with the users array
 *        Each User object includes: id, email, name, role, clerkId, and timestamps
 * 
 * Used with useActionState hook in React 19 components for administrative purposes
 * such as user management and role assignment.
 * 
 * Security: This function is protected and will return an error if called by
 * non-admin users, preventing unauthorized access to user data.
 */
export async function getUsers(): Promise<ActionState & {data?: {users: User[]}}> {
  let currentUser: User | null = null;
  
  try {
    // Require admin session with revalidation
    currentUser = await requireAdminSession();
    
    // Get all users ordered by creation date
    const usersList = await db
      .select()
      .from(users)
      .orderBy(users.createdAt);
    
    // Log successful user list access
    await logAuditEvent({
      userId: currentUser.clerkId,
      userEmail: currentUser.email,
      action: "USER_LIST_READ",
      resourceType: "user",
      status: "success",
      metadata: { userCount: usersList.length }
    });
    
    return {
      status: "success" as const,
      message: "Users retrieved successfully",
      data: { users: usersList }
    };
  } catch (error) {
    // Log failed attempt
    if (currentUser) {
      await logAuditEvent({
        userId: currentUser.clerkId,
        userEmail: currentUser.email,
        action: "USER_LIST_READ",
        resourceType: "user",
        status: "failed",
        metadata: { error: String(error) }
      });
    }
    
    console.error("Error fetching users:", error);
    const sanitized = sanitizeError(error, "DB_001");
    return {
      status: "error" as const,
      message: sanitized.publicMessage
    };
  }
}

/**
 * Server action to set or update a user's role in the system.
 * 
 * This function allows administrators to change a user's role to either 'admin' or 'user'.
 * Multiple security checks are performed:
 * 1. Verifies the current user has admin privileges
 * 2. Validates that required parameters are provided
 * 3. Confirms the requested role is valid
 * 4. Verifies the target user exists in the database
 * 
 * @param {string} email - The email address of the user whose role will be changed
 * @param {'admin' | 'user'} role - The new role to assign to the user
 * 
 * @returns {Promise<ActionState>} An object containing:
 *   - status: "success" or "error" indicating the operation result
 *   - message: A description of the operation outcome or detailed error reason
 * 
 * Used with useActionState hook in React 19 components for administrative user management.
 * 
 * Security: This function is protected and will return an error if:
 * - Called by non-admin users
 * - Missing required parameters
 * - Specifying an invalid role
 * - Targeting a non-existent user
 */
export async function setUserRole(email: string, role: 'admin' | 'user'): Promise<ActionState> {
  let currentUser: User | null = null;
  
  try {
    // Require admin session with revalidation - critical operation
    currentUser = await requireAdminSession();
    
    // Validate input
    if (!email || !role) {
      await logAuditEvent({
        userId: currentUser.clerkId,
        userEmail: currentUser.email,
        action: "USER_ROLE_UPDATE",
        resourceType: "user",
        status: "failed",
        metadata: { reason: "Missing email or role", targetEmail: email }
      });
      
      return {
        status: "error" as const,
        message: "Email and role are required"
      };
    }
    
    if (role !== 'admin' && role !== 'user') {
      await logAuditEvent({
        userId: currentUser.clerkId,
        userEmail: currentUser.email,
        action: "USER_ROLE_UPDATE",
        resourceType: "user",
        status: "failed",
        metadata: { reason: "Invalid role", targetEmail: email, attemptedRole: role }
      });
      
      return {
        status: "error" as const,
        message: "Role must be 'admin' or 'user'"
      };
    }
    
    // Check if user exists and get current role
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (existingUser.length === 0) {
      await logAuditEvent({
        userId: currentUser.clerkId,
        userEmail: currentUser.email,
        action: "USER_ROLE_UPDATE",
        resourceType: "user",
        status: "failed",
        metadata: { reason: "User not found", targetEmail: email }
      });
      
      return {
        status: "error" as const,
        message: "User not found"
      };
    }
    
    const oldRole = existingUser[0].role;
    
    // Update user role
    await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.email, email));
    
    // Log successful role change
    await logAuditEvent({
      userId: currentUser.clerkId,
      userEmail: currentUser.email,
      action: "USER_ROLE_UPDATE",
      resourceType: "user",
      resourceId: existingUser[0].id.toString(),
      status: "success",
      metadata: {
        targetEmail: email,
        oldRole,
        newRole: role,
        targetUserId: existingUser[0].id
      }
    });
    
    return { 
      status: "success" as const, 
      message: `User role updated to ${role}`
    };
  } catch (error) {
    // Log failed role change
    if (currentUser) {
      await logAuditEvent({
        userId: currentUser.clerkId,
        userEmail: currentUser.email,
        action: "USER_ROLE_UPDATE",
        resourceType: "user",
        status: "failed",
        metadata: { targetEmail: email, error: String(error) }
      });
    }
    
    console.error("Error setting user role:", error);
    const sanitized = sanitizeError(error, "DB_002");
    return {
      status: "error" as const,
      message: sanitized.publicMessage
    };
  }
}