"use server";

import { syncUserWithDatabase } from "@/lib/auth";
import { currentUser } from "@clerk/nextjs/server";

/**
 * Server action to sync the current Clerk user with our database
 * Replaces the POST /api/auth/sync-user endpoint
 * This handles automatic admin assignment to the first user
 */
export async function syncUser() {
  try {
    // Get the current authenticated user from Clerk
    const user = await currentUser();
    
    // If no user is authenticated, return error
    if (!user || !user.emailAddresses || user.emailAddresses.length === 0) {
      return {
        success: false,
        error: "No authenticated user found"
      };
    }
    
    // Get the user's primary email
    const primaryEmailObj = user.emailAddresses.find(
      email => email.id === user.primaryEmailAddressId
    ) || user.emailAddresses[0];
    
    const email = primaryEmailObj.emailAddress;
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    
    // Sync the user with our database (this handles first-user-as-admin logic)
    const dbUser = await syncUserWithDatabase(email, name);

    if (!dbUser) {
      return {
        success: false,
        error: "Failed to sync user with database"
      };
    }
    
    // Return the user data with role information
    return {
      success: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        isAdmin: dbUser.role === 'admin'
      }
    };
  } catch (error) {
    console.error("Error syncing user:", error);
    return {
      success: false,
      error: "Failed to sync user data"
    };
  }
}