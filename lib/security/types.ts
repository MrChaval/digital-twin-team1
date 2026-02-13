/**
 * TypeScript Types for Zero Trust Security Features
 * 
 * Created by: JaiZz
 * Date: February 13, 2026
 * Purpose: Type definitions for audit logging, session validation, and error handling
 */

// ============================================================================
// AUDIT LOGGING TYPES
// ============================================================================

/**
 * Actions that can be logged in the audit system
 */
export type AuditAction =
  // Project actions
  | "CREATE_PROJECT"
  | "UPDATE_PROJECT"
  | "DELETE_PROJECT"
  | "VIEW_PROJECT"
  // User management actions
  | "CREATE_USER"
  | "UPDATE_USER_ROLE"
  | "DELETE_USER"
  | "VIEW_USERS"
  // Admin actions
  | "ACCESS_ADMIN_PANEL"
  | "VIEW_AUDIT_LOGS"
  | "EXPORT_DATA"
  // Authentication actions
  | "LOGIN"
  | "LOGOUT"
  | "PASSWORD_RESET"
  | "SESSION_REFRESH"
  // Newsletter actions
  | "SUBSCRIBE_NEWSLETTER"
  | "UNSUBSCRIBE_NEWSLETTER"
  // System actions
  | "SYSTEM_ERROR"
  | "SECURITY_ALERT"
  | "RATE_LIMIT_EXCEEDED";

/**
 * Resources that can be affected by actions
 */
export type AuditResource = 
  | "projects" 
  | "users" 
  | "subscribers" 
  | "admin_panel" 
  | "audit_logs"
  | "system";

/**
 * Status of an audit action
 */
export type AuditStatus = "success" | "failed" | "denied";

/**
 * Input for creating an audit log entry
 */
export interface AuditLogInput {
  userId?: number | null;
  userEmail: string;
  action: AuditAction;
  resource?: AuditResource;
  resourceId?: number | string | null;
  metadata?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
  status: AuditStatus;
}

/**
 * Audit log entry as stored in database
 */
export interface AuditLog extends AuditLogInput {
  id: number;
  createdAt: Date;
}

/**
 * Query parameters for fetching audit logs
 */
export interface AuditLogQuery {
  userId?: number;
  userEmail?: string;
  action?: AuditAction;
  resource?: AuditResource;
  status?: AuditStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

// ============================================================================
// SESSION VALIDATION TYPES
// ============================================================================

/**
 * Session validation result
 */
export interface SessionValidation {
  isValid: boolean;
  userId: number;
  userEmail: string;
  isAdmin: boolean;
  sessionAge: number; // in milliseconds
  lastVerified: Date;
  requiresReauth?: boolean;
}

/**
 * Session revalidation options
 */
export interface SessionRevalidationOptions {
  requireAdmin?: boolean;
  maxAgeMinutes?: number;
  checkDatabase?: boolean;
}

/**
 * Fresh session requirement for sensitive operations
 */
export interface FreshSessionRequirement {
  maxAgeMinutes: number;
  reason: string;
}

// ============================================================================
// ERROR HANDLING TYPES
// ============================================================================

/**
 * Error categories for classification
 */
export type ErrorCategory = 
  | "DATABASE"
  | "AUTHENTICATION"
  | "AUTHORIZATION"
  | "VALIDATION"
  | "NETWORK"
  | "SYSTEM"
  | "EXTERNAL_SERVICE";

/**
 * Error severity levels
 */
export type ErrorSeverity = "low" | "medium" | "high" | "critical";

/**
 * Sanitized error response for clients
 */
export interface SanitizedError {
  message: string;
  code?: string;
  timestamp?: string;
}

/**
 * Detailed error for server-side logging
 */
export interface DetailedError {
  message: string;
  code: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  stack?: string;
  context?: Record<string, any>;
  userId?: number;
  timestamp: Date;
}

/**
 * Error monitoring payload
 */
export interface ErrorMonitoringPayload {
  error: Error | unknown;
  context: {
    userId?: number;
    userEmail?: string;
    action?: string;
    resource?: string;
    ipAddress?: string;
    userAgent?: string;
    [key: string]: any;
  };
  severity: ErrorSeverity;
  category: ErrorCategory;
  timestamp: Date;
}

// ============================================================================
// ERROR CODE TYPES
// ============================================================================

/**
 * Error code prefix by category
 */
export type ErrorCodePrefix = 
  | "DB"      // Database errors (DB_001, DB_002)
  | "AUTH"    // Authentication errors (AUTH_001, AUTH_002)
  | "PERM"    // Permission errors (PERM_001, PERM_002)
  | "VAL"     // Validation errors (VAL_001, VAL_002)
  | "PROJ"    // Project errors (PROJ_001, PROJ_002)
  | "USER"    // User errors (USER_001, USER_002)
  | "SYS"     // System errors (SYS_001, SYS_002)
  | "EXT";    // External service errors (EXT_001, EXT_002)

/**
 * Error code definition
 */
export interface ErrorCodeDefinition {
  code: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  publicMessage: string;
  internalDescription: string;
}

/**
 * Error code map
 */
export type ErrorCodeMap = Record<string, ErrorCodeDefinition>;

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Request context for security operations
 */
export interface RequestContext {
  userId?: number;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  path?: string;
  method?: string;
}

/**
 * Security operation result
 */
export interface SecurityOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: SanitizedError;
  auditLogId?: number;
}

/**
 * Admin verification result
 */
export interface AdminVerification {
  isAdmin: boolean;
  user: {
    id: number;
    email: string;
    role: string;
  } | null;
  verified: Date;
}
