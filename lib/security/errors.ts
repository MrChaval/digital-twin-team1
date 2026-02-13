/**
 * Error Sanitization and Handling Utilities
 * 
 * Created by: JaiZz
 * Date: February 13, 2026
 * Purpose: Never expose internal system details to users/attackers
 * 
 * SECURITY PRINCIPLE:
 * - Clients get generic messages ("An error occurred")
 * - Server logs get full details (stack traces, database errors, etc.)
 * - Error codes help with debugging without exposing internals
 * 
 * NOTE: This is a utility library - do NOT add "use server" directive
 */

import { logFailure } from "./audit";
import { getPublicMessage, getInternalDescription } from "./error-codes";
import {
  SanitizedError,
  DetailedError,
  ErrorCategory,
  ErrorSeverity,
} from "./types";

// ============================================================================
// ERROR SANITIZATION
// ============================================================================

/**
 * Sanitize error for client response
 * 
 * NEVER return raw error messages to clients!
 * 
 * @example
 * ```typescript
 * try {
 *   await db.insert(projects).values(data);
 * } catch (error) {
 *   // ❌ BAD: return { message: error.message }
 *   // ✅ GOOD:
 *   const sanitized = sanitizeError(error, "PROJ_001");
 *   return { success: false, ...sanitized };
 * }
 * ```
 */
export function sanitizeError(
  error: unknown,
  errorCode?: string
): SanitizedError {
  // Log full error details server-side
  if (error instanceof Error) {
    console.error("[SERVER_ERROR]", {
      message: error.message,
      stack: error.stack,
      code: errorCode,
      timestamp: new Date().toISOString(),
    });
  } else {
    console.error("[SERVER_ERROR]", {
      error: String(error),
      code: errorCode,
      timestamp: new Date().toISOString(),
    });
  }

  // Return generic message to client
  return {
    message: errorCode
      ? getPublicMessage(errorCode)
      : "An error occurred. Please try again.",
    code: errorCode,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Sanitize error with context
 * Includes audit logging
 * 
 * @example
 * ```typescript
 * try {
 *   await db.insert(projects).values(data);
 * } catch (error) {
 *   return sanitizeErrorWithContext(error, {
 *     code: "PROJ_001",
 *     category: "VALIDATION",
 *     severity: "medium",
 *     context: { userId: user.id, projectData: data },
 *     userEmail: user.email,
 *     action: "CREATE_PROJECT"
 *   });
 * }
 * ```
 */
export async function sanitizeErrorWithContext(
  error: unknown,
  options: {
    code: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    context?: Record<string, any>;
    userEmail?: string;
    action?: string;
  }
): Promise<SanitizedError> {
  // Create detailed error for logging
  const detailedError: DetailedError = {
    message: error instanceof Error ? error.message : String(error),
    code: options.code,
    category: options.category,
    severity: options.severity,
    stack: error instanceof Error ? error.stack : undefined,
    context: options.context,
    timestamp: new Date(),
  };

  // Log full details server-side
  console.error(`[${options.code}]`, {
    ...detailedError,
    internalDescription: getInternalDescription(options.code),
  });

  // Log to audit system if action provided
  if (options.action && options.userEmail) {
    await logFailure({
      userEmail: options.userEmail,
      action: options.action as any,
      metadata: {
        errorCode: options.code,
        errorMessage: detailedError.message,
        context: options.context,
      },
    });
  }

  // Return safe error to client
  return sanitizeError(error, options.code);
}

/**
 * Create safe error response for server actions
 * 
 * @example
 * ```typescript
 * export async function createProject(data) {
 *   try {
 *     const project = await db.insert(projects).values(data);
 *     return { success: true, data: project };
 *   } catch (error) {
 *     return createErrorResponse(error, "PROJ_001");
 *   }
 * }
 * ```
 */
export function createErrorResponse(
  error: unknown,
  errorCode: string
): {
  success: false;
  error: SanitizedError;
} {
  const sanitized = sanitizeError(error, errorCode);

  return {
    success: false,
    error: sanitized,
  };
}

/**
 * Create safe error response with audit logging
 * 
 * @example
 * ```typescript
 * export async function setUserRole(email, role) {
 *   try {
 *     await db.update(users).set({ role }).where(eq(users.email, email));
 *     return { success: true };
 *   } catch (error) {
 *     return await createErrorResponseWithAudit(error, {
 *       code: "USER_002",
 *       userEmail: currentUser.email,
 *       action: "UPDATE_USER_ROLE",
 *       category: "VALIDATION",
 *       severity: "medium",
 *       context: { targetEmail: email, role }
 *     });
 *   }
 * }
 * ```
 */
export async function createErrorResponseWithAudit(
  error: unknown,
  options: {
    code: string;
    userEmail: string;
    action: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    context?: Record<string, any>;
  }
): Promise<{
  success: false;
  error: SanitizedError;
}> {
  const sanitized = await sanitizeErrorWithContext(error, options);

  return {
    success: false,
    error: sanitized,
  };
}

// ============================================================================
// ERROR DETECTION HELPERS
// ============================================================================

/**
 * Check if error is a database error
 */
export function isDatabaseError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const dbKeywords = [
    "database",
    "postgres",
    "sql",
    "drizzle",
    "connection",
    "query",
    "constraint",
    "duplicate key",
    "foreign key",
  ];

  const message = error.message.toLowerCase();
  return dbKeywords.some((keyword) => message.includes(keyword));
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const authKeywords = [
    "unauthorized",
    "unauthenticated",
    "authentication",
    "clerk",
    "session",
    "token",
    "forbidden",
  ];

  const message = error.message.toLowerCase();
  return authKeywords.some((keyword) => message.includes(keyword));
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const validationKeywords = [
    "validation",
    "invalid",
    "required",
    "must be",
    "expected",
    "zod",
  ];

  const message = error.message.toLowerCase();
  return validationKeywords.some((keyword) => message.includes(keyword));
}

/**
 * Auto-detect error code based on error type
 * Fallback when you don't specify error code
 * 
 * @example
 * ```typescript
 * try {
 *   await db.insert(projects).values(data);
 * } catch (error) {
 *   const code = detectErrorCode(error); // Returns "DB_003", "VAL_003", etc.
 *   return createErrorResponse(error, code);
 * }
 * ```
 */
export function detectErrorCode(error: unknown): string {
  if (isDatabaseError(error)) {
    return "DB_003"; // Data validation/general DB error
  }

  if (isAuthError(error)) {
    return "AUTH_001"; // Authentication required
  }

  if (isValidationError(error)) {
    return "VAL_003"; // Validation failed
  }

  return "SYS_001"; // Unknown/system error
}

// ============================================================================
// CONVENIENCE WRAPPERS
// ============================================================================

/**
 * Wrap server action with automatic error handling
 * 
 * @example
 * ```typescript
 * export const createProject = withErrorHandling(
 *   async (data) => {
 *     const user = await getCurrentUser();
 *     const project = await db.insert(projects).values(data);
 *     return { success: true, data: project };
 *   },
 *   {
 *     errorCode: "PROJ_001",
 *     action: "CREATE_PROJECT"
 *   }
 * );
 * ```
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    errorCode: string;
    action?: string;
  }
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error(`[${options.errorCode}] Error in ${options.action || "operation"}:`, error);
      return createErrorResponse(error, options.errorCode);
    }
  }) as T;
}

/**
 * Safe database operation wrapper
 * Automatically catches and sanitizes database errors
 * 
 * @example
 * ```typescript
 * export async function getProjects() {
 *   return safeDbOperation(
 *     async () => {
 *       return await db.select().from(projects);
 *     },
 *     "DB_003",
 *     "Failed to fetch projects"
 *   );
 * }
 * ```
 */
export async function safeDbOperation<T>(
  operation: () => Promise<T>,
  errorCode: string = "DB_003",
  logMessage?: string
): Promise<{ success: true; data: T } | { success: false; error: SanitizedError }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    if (logMessage) {
      console.error(`[${errorCode}] ${logMessage}`, error);
    }
    return createErrorResponse(error, errorCode);
  }
}
