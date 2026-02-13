/**
 * Error Monitoring and External Service Integration
 * 
 * Created by: JaiZz
 * Date: February 13, 2026
 * Purpose: Integrate with external monitoring services (Sentry, LogRocket, etc.)
 * 
 * NOTE: This is a template - configure with your actual monitoring service
 * NOTE: This is a utility library - do NOT add "use server" directive
 */

import { logFailure } from "./audit";
import { ErrorMonitoringPayload, ErrorSeverity, ErrorCategory } from "./types";

// ============================================================================
// MONITORING CONFIGURATION
// ============================================================================

/**
 * Check if monitoring is enabled
 * Set MONITORING_ENABLED=true in .env to enable
 */
function isMonitoringEnabled(): boolean {
  return process.env.MONITORING_ENABLED === "true";
}

/**
 * Get monitoring service type
 * Options: 'sentry', 'logrocket', 'datadog', 'custom'
 */
function getMonitoringService(): string {
  return process.env.MONITORING_SERVICE || "console";
}

// ============================================================================
// ERROR TRACKING
// ============================================================================

/**
 * Track error in external monitoring service
 * 
 * @example
 * ```typescript
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   await trackError(error, {
 *     userId: user.id,
 *     userEmail: user.email,
 *     action: "CREATE_PROJECT",
 *     severity: "high",
 *     category: "DATABASE"
 *   });
 *   throw error; // Re-throw after tracking
 * }
 * ```
 */
export async function trackError(
  error: unknown,
  context: {
    userId?: number;
    userEmail?: string;
    action?: string;
    resource?: string;
    ipAddress?: string;
    userAgent?: string;
    [key: string]: any;
  },
  severity: ErrorSeverity = "medium",
  category: ErrorCategory = "SYSTEM"
): Promise<void> {
  const payload: ErrorMonitoringPayload = {
    error,
    context,
    severity,
    category,
    timestamp: new Date(),
  };

  // Always log to console
  console.error("[ERROR_TRACKING]", {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
    severity,
    category,
    timestamp: payload.timestamp.toISOString(),
  });

  // Log to audit system
  if (context.userEmail && context.action) {
    await logFailure({
      userId: context.userId,
      userEmail: context.userEmail,
      action: context.action as any,
      resource: context.resource as any,
      metadata: {
        errorMessage: error instanceof Error ? error.message : String(error),
        severity,
        category,
        context,
      },
    });
  }

  // Send to external monitoring service
  if (isMonitoringEnabled()) {
    const service = getMonitoringService();

    switch (service) {
      case "sentry":
        await sendToSentry(payload);
        break;
      case "logrocket":
        await sendToLogRocket(payload);
        break;
      case "datadog":
        await sendToDatadog(payload);
        break;
      case "console":
      default:
        // Already logged to console above
        break;
    }
  }
}

/**
 * Track critical error (high priority alert)
 * 
 * @example
 * ```typescript
 * try {
 *   await criticalOperation();
 * } catch (error) {
 *   await trackCriticalError(error, {
 *     userId: user.id,
 *     action: "DELETE_ALL_PROJECTS",
 *   });
 * }
 * ```
 */
export async function trackCriticalError(
  error: unknown,
  context: Record<string, any>
): Promise<void> {
  return trackError(error, context, "critical", "SYSTEM");
}

// ============================================================================
// MONITORING SERVICE INTEGRATIONS
// ============================================================================

/**
 * Send error to Sentry
 * 
 * SETUP:
 * 1. Install: pnpm add @sentry/nextjs
 * 2. Configure: npx @sentry/wizard@latest -i nextjs
 * 3. Set SENTRY_DSN in .env
 */
async function sendToSentry(payload: ErrorMonitoringPayload): Promise<void> {
  try {
    // Uncomment when Sentry is installed:
    /*
    const Sentry = await import('@sentry/nextjs');
    
    Sentry.captureException(payload.error, {
      level: mapSeverityToSentryLevel(payload.severity),
      tags: {
        category: payload.category,
      },
      contexts: {
        user: {
          id: payload.context.userId?.toString(),
          email: payload.context.userEmail,
        },
        action: {
          name: payload.context.action,
          resource: payload.context.resource,
        },
      },
      extra: payload.context,
    });
    */

    console.log("[SENTRY] Would send error to Sentry:", {
      error:
        payload.error instanceof Error
          ? payload.error.message
          : String(payload.error),
      severity: payload.severity,
    });
  } catch (error) {
    console.error("[SENTRY_ERROR] Failed to send to Sentry:", error);
  }
}

/**
 * Send error to LogRocket
 * 
 * SETUP:
 * 1. Install: pnpm add logrocket
 * 2. Configure in app/layout.tsx
 * 3. Set LOGROCKET_APP_ID in .env
 */
async function sendToLogRocket(payload: ErrorMonitoringPayload): Promise<void> {
  try {
    // Uncomment when LogRocket is installed:
    /*
    const LogRocket = await import('logrocket');
    
    LogRocket.captureException(payload.error, {
      tags: {
        severity: payload.severity,
        category: payload.category,
      },
      extra: payload.context,
    });
    */

    console.log("[LOGROCKET] Would send error to LogRocket:", {
      error:
        payload.error instanceof Error
          ? payload.error.message
          : String(payload.error),
      severity: payload.severity,
    });
  } catch (error) {
    console.error("[LOGROCKET_ERROR] Failed to send to LogRocket:", error);
  }
}

/**
 * Send error to Datadog
 * 
 * SETUP:
 * 1. Install: pnpm add @datadog/browser-logs
 * 2. Configure in app/layout.tsx
 * 3. Set DD_CLIENT_TOKEN and DD_APPLICATION_ID in .env
 */
async function sendToDatadog(payload: ErrorMonitoringPayload): Promise<void> {
  try {
    // Uncomment when Datadog is installed:
    /*
    const { datadogLogs } = await import('@datadog/browser-logs');
    
    datadogLogs.logger.error(
      payload.error instanceof Error ? payload.error.message : String(payload.error),
      {
        error: payload.error,
        severity: payload.severity,
        category: payload.category,
        ...payload.context,
      }
    );
    */

    console.log("[DATADOG] Would send error to Datadog:", {
      error:
        payload.error instanceof Error
          ? payload.error.message
          : String(payload.error),
      severity: payload.severity,
    });
  } catch (error) {
    console.error("[DATADOG_ERROR] Failed to send to Datadog:", error);
  }
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Track slow operation
 * Alert when operations take longer than expected
 * 
 * @example
 * ```typescript
 * const start = Date.now();
 * await slowDatabaseQuery();
 * await trackSlowOperation("Database Query", Date.now() - start, 1000);
 * ```
 */
export async function trackSlowOperation(
  operationName: string,
  durationMs: number,
  thresholdMs: number = 3000
): Promise<void> {
  if (durationMs > thresholdMs) {
    console.warn("[SLOW_OPERATION]", {
      operation: operationName,
      durationMs,
      thresholdMs,
      timestamp: new Date().toISOString(),
    });

    // Track in monitoring service
    if (isMonitoringEnabled()) {
      await trackError(
        new Error(`Slow operation: ${operationName} took ${durationMs}ms`),
        {
          operation: operationName,
          durationMs,
          thresholdMs,
        },
        "low",
        "SYSTEM"
      );
    }
  }
}

/**
 * Measure operation duration and track if slow
 * 
 * @example
 * ```typescript
 * export async function getProjects() {
 *   return await measureOperation(
 *     "getProjects",
 *     async () => await db.select().from(projects),
 *     2000 // Alert if takes > 2 seconds
 *   );
 * }
 * ```
 */
export async function measureOperation<T>(
  operationName: string,
  operation: () => Promise<T>,
  thresholdMs: number = 3000
): Promise<T> {
  const start = Date.now();

  try {
    const result = await operation();
    const duration = Date.now() - start;

    await trackSlowOperation(operationName, duration, thresholdMs);

    return result;
  } catch (error) {
    const duration = Date.now() - start;

    await trackError(
      error,
      {
        operation: operationName,
        durationMs: duration,
      },
      "high",
      "SYSTEM"
    );

    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map severity to Sentry level
 */
function mapSeverityToSentryLevel(
  severity: ErrorSeverity
): "fatal" | "error" | "warning" | "info" {
  switch (severity) {
    case "critical":
      return "fatal";
    case "high":
      return "error";
    case "medium":
      return "warning";
    case "low":
      return "info";
    default:
      return "error";
  }
}
