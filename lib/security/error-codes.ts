/**
 * Error Code Dictionary
 * 
 * Created by: JaiZz
 * Date: February 13, 2026
 * Purpose: Standardized error codes for debugging without exposing internal details
 * 
 * HOW TO USE:
 * - Use getErrorCode() in catch blocks
 * - Log the internal description server-side
 * - Return only the public message to clients
 * - Use error code for support tickets
 */

import { ErrorCodeMap, ErrorCodeDefinition } from "./types";

// ============================================================================
// ERROR CODE DEFINITIONS
// ============================================================================

/**
 * Complete error code dictionary
 * Format: PREFIX_NNN
 * Example: DB_001, AUTH_002, PROJ_003
 */
export const ERROR_CODES: ErrorCodeMap = {
  // ============================================================================
  // DATABASE ERRORS (DB_xxx)
  // ============================================================================
  DB_001: {
    code: "DB_001",
    category: "DATABASE",
    severity: "high",
    publicMessage: "Unable to connect to database. Please try again later.",
    internalDescription: "Database connection failed - Check PostgreSQL connection string",
  },
  DB_002: {
    code: "DB_002",
    category: "DATABASE",
    severity: "high",
    publicMessage: "Operation timed out. Please try again.",
    internalDescription: "Database query timeout - Consider optimizing query or increasing timeout",
  },
  DB_003: {
    code: "DB_003",
    category: "DATABASE",
    severity: "medium",
    publicMessage: "Invalid data format. Please check your input.",
    internalDescription: "Data validation failed in Drizzle ORM - Check schema constraints",
  },
  DB_004: {
    code: "DB_004",
    category: "DATABASE",
    severity: "medium",
    publicMessage: "Unable to complete operation. Please try again.",
    internalDescription: "Database constraint violation - Check foreign keys and unique constraints",
  },

  // ============================================================================
  // AUTHENTICATION ERRORS (AUTH_xxx)
  // ============================================================================
  AUTH_001: {
    code: "AUTH_001",
    category: "AUTHENTICATION",
    severity: "medium",
    publicMessage: "Please log in to continue.",
    internalDescription: "User not authenticated - Clerk session invalid or expired",
  },
  AUTH_002: {
    code: "AUTH_002",
    category: "AUTHENTICATION",
    severity: "medium",
    publicMessage: "Your session has expired. Please log in again.",
    internalDescription: "Clerk session expired - User needs to re-authenticate",
  },
  AUTH_003: {
    code: "AUTH_003",
    category: "AUTHENTICATION",
    severity: "high",
    publicMessage: "Account not found. Please contact support.",
    internalDescription: "User exists in Clerk but not in local database - Run syncUserWithDatabase",
  },
  AUTH_004: {
    code: "AUTH_004",
    category: "AUTHENTICATION",
    severity: "medium",
    publicMessage: "Recent login required. Please log in again.",
    internalDescription: "Session too old for sensitive operation - requireFreshSession failed",
  },

  // ============================================================================
  // AUTHORIZATION ERRORS (PERM_xxx)
  // ============================================================================
  PERM_001: {
    code: "PERM_001",
    category: "AUTHORIZATION",
    severity: "medium",
    publicMessage: "You don't have permission to perform this action.",
    internalDescription: "User lacks required role - isAdmin() returned false",
  },
  PERM_002: {
    code: "PERM_002",
    category: "AUTHORIZATION",
    severity: "high",
    publicMessage: "Access denied. Admin privileges required.",
    internalDescription: "Admin-only endpoint accessed by non-admin user",
  },
  PERM_003: {
    code: "PERM_003",
    category: "AUTHORIZATION",
    severity: "medium",
    publicMessage: "You can only modify your own content.",
    internalDescription: "User attempted to modify resource they don't own",
  },

  // ============================================================================
  // VALIDATION ERRORS (VAL_xxx)
  // ============================================================================
  VAL_001: {
    code: "VAL_001",
    category: "VALIDATION",
    severity: "low",
    publicMessage: "Invalid email format. Please check your input.",
    internalDescription: "Email validation failed in Zod schema",
  },
  VAL_002: {
    code: "VAL_002",
    category: "VALIDATION",
    severity: "low",
    publicMessage: "Required fields are missing. Please fill in all fields.",
    internalDescription: "Required field validation failed in Zod schema",
  },
  VAL_003: {
    code: "VAL_003",
    category: "VALIDATION",
    severity: "low",
    publicMessage: "Input data is invalid. Please check your entries.",
    internalDescription: "Zod schema validation failed - Check validation error details",
  },
  VAL_004: {
    code: "VAL_004",
    category: "VALIDATION",
    severity: "medium",
    publicMessage: "File type not allowed. Please upload a valid file.",
    internalDescription: "File upload validation failed - Invalid MIME type or extension",
  },

  // ============================================================================
  // PROJECT ERRORS (PROJ_xxx)
  // ============================================================================
  PROJ_001: {
    code: "PROJ_001",
    category: "VALIDATION",
    severity: "medium",
    publicMessage: "Unable to create project. Please try again.",
    internalDescription: "Project creation failed in createProject() - Check database logs",
  },
  PROJ_002: {
    code: "PROJ_002",
    category: "VALIDATION",
    severity: "medium",
    publicMessage: "Unable to update project. Please try again.",
    internalDescription: "Project update failed - Check if project exists and user has permission",
  },
  PROJ_003: {
    code: "PROJ_003",
    category: "VALIDATION",
    severity: "medium",
    publicMessage: "Project not found.",
    internalDescription: "Project does not exist in database - Check projectId",
  },
  PROJ_004: {
    code: "PROJ_004",
    category: "VALIDATION",
    severity: "medium",
    publicMessage: "Unable to delete project. Please try again.",
    internalDescription: "Project deletion failed - Check foreign key constraints",
  },

  // ============================================================================
  // USER ERRORS (USER_xxx)
  // ============================================================================
  USER_001: {
    code: "USER_001",
    category: "VALIDATION",
    severity: "medium",
    publicMessage: "Unable to create user account. Please try again.",
    internalDescription: "User creation failed in syncUserWithDatabase() - Check database logs",
  },
  USER_002: {
    code: "USER_002",
    category: "VALIDATION",
    severity: "medium",
    publicMessage: "Unable to update user role. Please try again.",
    internalDescription: "Role update failed in setUserRole() - Check if user exists",
  },
  USER_003: {
    code: "USER_003",
    category: "VALIDATION",
    severity: "low",
    publicMessage: "User not found.",
    internalDescription: "User does not exist in database - Check email/userId",
  },
  USER_004: {
    code: "USER_004",
    category: "VALIDATION",
    severity: "medium",
    publicMessage: "This email is already registered.",
    internalDescription: "Duplicate email - User already exists in database",
  },

  // ============================================================================
  // SYSTEM ERRORS (SYS_xxx)
  // ============================================================================
  SYS_001: {
    code: "SYS_001",
    category: "SYSTEM",
    severity: "critical",
    publicMessage: "An unexpected error occurred. Please contact support.",
    internalDescription: "Unhandled exception - Check error logs for stack trace",
  },
  SYS_002: {
    code: "SYS_002",
    category: "SYSTEM",
    severity: "high",
    publicMessage: "Service temporarily unavailable. Please try again later.",
    internalDescription: "System resource exhaustion - Check server memory/CPU",
  },
  SYS_003: {
    code: "SYS_003",
    category: "SYSTEM",
    severity: "medium",
    publicMessage: "Configuration error. Please contact support.",
    internalDescription: "Missing or invalid environment variables - Check .env file",
  },

  // ============================================================================
  // EXTERNAL SERVICE ERRORS (EXT_xxx)
  // ============================================================================
  EXT_001: {
    code: "EXT_001",
    category: "EXTERNAL_SERVICE",
    severity: "high",
    publicMessage: "Unable to connect to authentication service. Please try again.",
    internalDescription: "Clerk API error - Check Clerk service status and API key",
  },
  EXT_002: {
    code: "EXT_002",
    category: "EXTERNAL_SERVICE",
    severity: "medium",
    publicMessage: "Unable to send email. Please try again later.",
    internalDescription: "Email service failed - Check email provider configuration",
  },
  EXT_003: {
    code: "EXT_003",
    category: "EXTERNAL_SERVICE",
    severity: "medium",
    publicMessage: "Unable to upload file. Please try again.",
    internalDescription: "File upload service failed - Check storage provider (S3, Cloudinary, etc.)",
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get error code definition
 * 
 * @example
 * ```typescript
 * const errorDef = getErrorCode("DB_001");
 * console.log(errorDef.publicMessage); // "Unable to connect to database..."
 * console.log(errorDef.internalDescription); // "Database connection failed..."
 * ```
 */
export function getErrorCode(code: string): ErrorCodeDefinition | null {
  return ERROR_CODES[code] || null;
}

/**
 * Get public error message for a code
 * Safe to send to clients
 * 
 * @example
 * ```typescript
 * return {
 *   success: false,
 *   message: getPublicMessage("DB_001"),
 *   code: "DB_001"
 * };
 * ```
 */
export function getPublicMessage(code: string): string {
  const errorDef = getErrorCode(code);
  return errorDef?.publicMessage || "An error occurred. Please try again.";
}

/**
 * Get internal description for a code
 * For server-side logging only
 * 
 * @example
 * ```typescript
 * console.error(`[${code}] ${getInternalDescription(code)}`);
 * ```
 */
export function getInternalDescription(code: string): string {
  const errorDef = getErrorCode(code);
  return errorDef?.internalDescription || "Unknown error";
}

/**
 * Check if error code exists
 */
export function isValidErrorCode(code: string): boolean {
  return code in ERROR_CODES;
}

/**
 * Get all error codes for a category
 * Useful for filtering/searching
 * 
 * @example
 * ```typescript
 * const dbErrors = getErrorsByCategory("DATABASE");
 * // Returns: [DB_001, DB_002, DB_003, DB_004]
 * ```
 */
export function getErrorsByCategory(category: string): ErrorCodeDefinition[] {
  return Object.values(ERROR_CODES).filter(
    (error) => error.category === category
  );
}

/**
 * Get all error codes by severity
 * 
 * @example
 * ```typescript
 * const criticalErrors = getErrorsBySeverity("critical");
 * ```
 */
export function getErrorsBySeverity(severity: string): ErrorCodeDefinition[] {
  return Object.values(ERROR_CODES).filter(
    (error) => error.severity === severity
  );
}
