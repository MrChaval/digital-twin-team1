"use server"

import { db, subscribers } from "@/lib/db"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { ActionState, newsletterSubscriptionSchema } from "@/lib/types"
import { logAuditEvent } from "@/lib/security/audit"
import { sanitizeError } from "@/lib/security/errors"
import { validateMultipleInputs } from "@/lib/security/sql-injection-logger"

// Export the interface so it can be used in components
export interface NewsletterState extends ActionState {
  email?: string;
  name?: string;
}

// Create an async function to return the initial state instead of exporting the object directly
export async function getInitialNewsletterState(): Promise<NewsletterState> {
  return {
    status: "idle",
    message: "",
  };
}

/**
 * Server action to subscribe a user to the newsletter
 * For use with useActionState in React 19
 * Public action - no authentication required
 */
export async function subscribeToNewsletter(
  prevState: NewsletterState,
  formData: FormData
): Promise<NewsletterState> {

  // Parse the form data
  const email = formData.get("email") as string
  const name = formData.get("name") as string

  // 🛡️ SQL INJECTION DETECTION - Log any SQL injection attempts
  const sqlValidation = await validateMultipleInputs([
    { value: email || '', source: 'newsletter_email' },
    { value: name || '', source: 'newsletter_name' },
  ], { action: 'newsletter_subscription' });

  // If SQL injection detected with high confidence, block immediately
  if (!sqlValidation.allSafe) {
    const highConfidenceAttack = sqlValidation.results.find(r => r.confidence > 0.7);
    if (highConfidenceAttack) {
      return {
        status: "error",
        message: "Invalid input detected. Please check your data and try again.",
      };
    }
  }

  // Validate the input with Zod schema
  const validationResult = newsletterSubscriptionSchema.safeParse({ email, name });
  if (!validationResult.success) {
    return {
      status: "error",
      message: validationResult.error.errors[0]?.message || "Invalid input data",
    }
  }

  try {
    // Check if email already exists
    const existingSubscriber = await db.select().from(subscribers).where(eq(subscribers.email, email))

    if (existingSubscriber.length > 0) {
      // Log duplicate subscription attempt
      await logAuditEvent({
        userId: "anonymous",
        userEmail: email,
        action: "NEWSLETTER_SUBSCRIBE",
        resourceType: "newsletter",
        status: "failed",
        metadata: { reason: "Already subscribed", email }
      });
      
      return {
        status: "error",
        message: "You are already subscribed to our newsletter",
        email,
        name,
      }
    }

    // Insert new subscriber
    const inserted = await db.insert(subscribers).values({
      email,
      name: name || null,
    }).returning();
    
    // Log successful subscription
    await logAuditEvent({
      userId: "anonymous",
      userEmail: email,
      action: "NEWSLETTER_SUBSCRIBE",
      resourceType: "newsletter",
      resourceId: inserted[0]?.id.toString(),
      status: "success",
      metadata: { email, hasName: !!name }
    });

    revalidatePath("/")

    return {
      status: "success",
      message: "Thank you for subscribing to our newsletter!",
      email,
      name,
    }
  } catch (error) {
    console.error("Error subscribing to newsletter:", error);
    const sanitized = sanitizeError(error, "DB_005");
    
    // Log failed subscription
    await logAuditEvent({
      userId: "anonymous",
      userEmail: email || "unknown",
      action: "NEWSLETTER_SUBSCRIBE",
      resourceType: "newsletter",
      status: "failed",
      metadata: { error: String(error) }
    });
    
    return {
      status: "error",
      message: sanitized.publicMessage,
    }
  }
}

/**
 * Server action to get all newsletter subscribers
 * Public read operation (consider restricting to admin in production)
 */
export async function getSubscribers(): Promise<Array<typeof subscribers.$inferSelect>> {  
  try {
    const allSubscribers = await db.select().from(subscribers).orderBy(subscribers.createdAt)
    return allSubscribers
  } catch (error) {
    console.error("Error fetching subscribers:", error);
    const sanitized = sanitizeError(error, "DB_006");
    // Return empty array instead of exposing error details
    return []
  }
}
