"use server";

import { isAdmin, getCurrentUser } from "@/lib/auth";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { User, ActionState } from "@/lib/types";

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
    return { 
      status: "success" as const,
      message: "Admin status checked successfully",
      data: { isAdmin: userIsAdmin }
    };
  } catch (error) {
    console.error("Error checking admin status:", error);
    return { 
      status: "error" as const,
      message: "Failed to check admin status"
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
    return { 
      status: "success" as const,
      message: "User retrieved successfully",
      data: { user }
    };
  } catch (error) {
    console.error("Error getting user:", error);
    return { 
      status: "error" as const,
      message: "Failed to get user information"
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
  try {
    // First check if the current user is an admin
    const userIsAdmin = await isAdmin();
    
    if (!userIsAdmin) {
      return { 
        status: "error" as const,
        message: "Unauthorized. Admin privileges required"
      };
    }
    
    // Get all users ordered by creation date
    const usersList = await db
      .select()
      .from(users)
      .orderBy(users.createdAt);
    
    return {
      status: "success" as const,
      message: "Users retrieved successfully",
      data: { users: usersList }
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      status: "error" as const,
      message: "Failed to fetch users"
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
  try {
    // First check if the current user is an admin
    const userIsAdmin = await isAdmin();
    
    if (!userIsAdmin) {
      return {
        status: "error" as const,
        message: "Unauthorized. Admin privileges required"
      };
    }
    
    if (!email || !role) {
      return {
        status: "error" as const,
        message: "Email and role are required"
      };
    }
    
    if (role !== 'admin' && role !== 'user') {
      return {
        status: "error" as const,
        message: "Role must be 'admin' or 'user'"
      };
    }
    
    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (existingUser.length === 0) {
      return {
        status: "error" as const,
        message: "User not found"
      };
    }
    
    // Update user role
    await db
      .update(users)
      .set({ role })
      .where(eq(users.email, email));
    
    return { 
      status: "success" as const, 
      message: `User role updated to ${role}`
    };
  } catch (error) {
    console.error("Error setting user role:", error);
    return {
      status: "error" as const,
      message: "Failed to set user role"
    };
  }
}