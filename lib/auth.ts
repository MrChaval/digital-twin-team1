import { db, subscribers, users } from "@/lib/db";
import { User } from "@/lib/types";
import { currentUser } from "@clerk/nextjs/server";
import { eq, sql } from "drizzle-orm";

/**
 * Checks if the current user is an admin using the user's email from Clerk
 * Safe to use in routes and pages
 * @returns Boolean indicating if the current user has admin privileges
 */
export async function isAdmin(): Promise<boolean> {
  try {
    // Use currentUser() which is safe in route handlers and pages
    const clerk = await currentUser();
    
    // If no user is logged in, they can't be an admin
    if (!clerk || !clerk.emailAddresses || clerk.emailAddresses.length === 0) {
      return false;
    }
    
    // Get primary email
    const primaryEmailObj = clerk.emailAddresses.find(email => email.id === clerk.primaryEmailAddressId) 
      || clerk.emailAddresses[0];
    
    const email = primaryEmailObj.emailAddress;
    
    // Query the database to find the user record by email and check role
    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    // If user exists and is admin, return true
    return userResults.length > 0 && userResults[0].role === 'admin';
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Gets the current user from the database based on Clerk user
 * Safe to use in routes and pages
 * @returns User object with role information
 */
export async function getCurrentUser() {
  try {
    // Use currentUser() which is safe in route handlers and pages
    const clerk = await currentUser();
    
    // If no user is logged in, return null
    if (!clerk || !clerk.emailAddresses || clerk.emailAddresses.length === 0) {
      return null;
    }
    
    // Get primary email
    const primaryEmailObj = clerk.emailAddresses.find(email => email.id === clerk.primaryEmailAddressId) 
      || clerk.emailAddresses[0];
    
    const email = primaryEmailObj.emailAddress;
    
    // Query the database to find the user record by email
    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    // Return the user record or null if not found
    return userResults.length > 0 ? userResults[0] : null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Creates or updates the user record in the database based on Clerk user data
 * Can be used in API routes or server components safely
 * @param email User email
 * @param name User name (optional)
 * @returns The user record
 */
export async function syncUserWithDatabase(email: string, name: string = ''): Promise<User | null> {
  try {
    if (!email) {
      throw new Error("Email is required");
    }
    
    // Get Clerk user for ID
    const clerk = await currentUser();
    if (!clerk) {
      throw new Error("No authenticated user found");
    }
    
    const clerkId = clerk.id;
    
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    // If user already exists, return the existing user
    if (existingUser.length > 0) {
      return existingUser[0];
    }
    
    // Check if this is the first user in the system
    const totalUsers = await db
      .select({ count: sql`count(*)` })
      .from(users);
    
    const isFirstUser = totalUsers[0]?.count === '0';
    
    // Insert the new user with appropriate role
    await db.insert(users).values({
      email,
      name,
      clerkId,
      role: isFirstUser ? 'admin' : 'user',
      isFirstUser,
    });
    
    // Get the newly created user
    const newUserResults = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    // Also add to subscribers if not already there (for newsletters)
    const existingSubscriber = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.email, email))
      .limit(1);
      
    if (existingSubscriber.length === 0) {
      await db.insert(subscribers).values({
        email,
        name
      });
    }
    
    return newUserResults[0];
  } catch (error) {
    console.error("Error syncing user with database:", error);
    return null;
  }
}

/**
 * Migrates existing users from subscribers table to users table
 * This is a one-time migration function
 */
export async function migrateExistingUsers() {
  try {
    // Get all existing users from subscribers that have a role
    const subscribersList = await db
      .select()
      .from(subscribers);
      
    if (subscribersList.length === 0) {
      console.log("No subscribers to migrate");
      return;
    }
    
    // Get current Clerk user for ID
    const clerk = await currentUser();
    if (!clerk) {
      throw new Error("No authenticated user found");
    }
    
    const clerkId = clerk.id;
    const email = clerk.emailAddresses[0].emailAddress;
    
    // Get existing users in the users table
    const existingUsers = await db
      .select()
      .from(users);
      
    const existingEmails = existingUsers.map(user => user.email);
    
    // Add the current user as admin if not already in users table
    if (!existingEmails.includes(email)) {
      await db.insert(users).values({
        email,
        name: clerk.firstName && clerk.lastName 
          ? `${clerk.firstName} ${clerk.lastName}` 
          : "",
        clerkId,
        role: 'admin',
        isFirstUser: true,
      });
      
      console.log(`Added current user ${email} as admin`);
    }
    
    console.log(`Migration complete. ${existingUsers.length + 1} users in users table.`);
  } catch (error) {
    console.error("Error migrating users:", error);
  }
}