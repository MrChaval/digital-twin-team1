"use server";

import { auth } from "@clerk/nextjs/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

/**
 * Check if the current user has admin role in the database
 */
export async function checkIsAdmin() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      console.log("No authenticated user found");
      return { isAdmin: false };
    }
    
    // Query the database to check if the user has admin role
    const dbUsers = await db.select().from(users).where(eq(users.clerkId, userId));
    const dbUser = dbUsers[0];
    
    if (!dbUser) {
      console.log(`User with Clerk ID ${userId} not found in database`);
      return { isAdmin: false };
    }
    
    // Check if the user's role is "Admin"
    const isAdmin = dbUser.role === "admin";
    
    console.log(`User ${userId} has role "${dbUser.role}", admin status: ${isAdmin}`);
    
    return { isAdmin };
  } catch (error) {
    console.error("Error checking admin status:", error);
    return { isAdmin: false, error: String(error) };
  }
}
