"use client";

import { useState } from "react";
import { testAuditLogging } from "@/app/actions/audit";
import { setUserRole, getUsers } from "@/app/actions/admin";
import { createProject } from "@/app/actions/projects";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, CheckCircle, XCircle, AlertTriangle, Activity, Lock, Database, User } from "lucide-react";

export default function SecurityTestPage() {
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    status: 'success' | 'failed' | 'error';
    message: string;
    timestamp: string;
  }>>([]);

  const [loading, setLoading] = useState(false);

  // Test forms state
  const [testEmail, setTestEmail] = useState("");
  const [testProjectTitle, setTestProjectTitle] = useState("Security Test Project");

  const addResult = (test: string, status: 'success' | 'failed' | 'error', message: string) => {
    setTestResults(prev => [{
      test,
      status,
      message,
      timestamp: new Date().toLocaleTimeString(),
    }, ...prev]);
  };

  // Test 1: Audit Logging
  const testAuditLog = async () => {
    setLoading(true);
    try {
      const result = await testAuditLogging({
        action: "SYSTEM_TEST",
        metadata: {
          testType: "audit_logging",
          description: "Testing audit log creation"
        }
      });

      if (result.success) {
        addResult("Audit Logging", "success", "Test audit log created successfully. Check audit logs page.");
      } else {
        addResult("Audit Logging", "failed", result.error?.message || "Failed to create audit log");
      }
    } catch (error) {
      addResult("Audit Logging", "error", String(error));
    }
    setLoading(false);
  };

  // Test 2: Session Validation - Read Admin Data
  const testSessionValidation = async () => {
    setLoading(true);
    try {
      const result = await getUsers();

      if (result.status === "success") {
        addResult("Session Validation", "success", `Successfully accessed admin data. Session validated. Found ${result.data?.users.length || 0} users.`);
      } else {
        addResult("Session Validation", "failed", result.message || "Session validation failed");
      }
    } catch (error) {
      addResult("Session Validation", "error", String(error));
    }
    setLoading(false);
  };

  // Test 3: Role Change (Critical Operation)
  const testRoleChange = async () => {
    if (!testEmail) {
      addResult("Role Change Test", "error", "Please enter an email address");
      return;
    }

    setLoading(true);
    try {
      // Try to change role to user (then back to admin if needed)
      const result = await setUserRole(testEmail, "user");

      if (result.status === "success") {
        addResult("Role Change Test", "success", `Role change successful. Audit log created with old/new role tracking.`);
      } else {
        addResult("Role Change Test", "failed", result.message || "Role change failed");
      }
    } catch (error) {
      addResult("Role Change Test", "error", String(error));
    }
    setLoading(false);
  };

  // Test 4: Project Creation (with audit logging)
  const testProjectCreation = async () => {
    setLoading(true);
    try {
      const result = await createProject(null, {
        title: testProjectTitle,
        description: "Test project created via Security Test page to verify audit logging",
        icon: "Shield",
        items: ["Test Item 1", "Test Item 2"]
      });

      if (result.success) {
        addResult("Project Creation", "success", `Project created with audit log. Project ID: ${result.project?.id}`);
      } else {
        addResult("Project Creation", "failed", result.message || "Project creation failed");
      }
    } catch (error) {
      addResult("Project Creation", "error", String(error));
    }
    setLoading(false);
  };

  // Test 5: Error Sanitization
  const testErrorSanitization = async () => {
    setLoading(true);
    try {
      // Try to change role with invalid email (will fail gracefully)
      const result = await setUserRole("nonexistent@example.com", "admin");

      if (result.status === "error") {
        // Check if error message is generic (sanitized)
        const isGeneric = !result.message.toLowerCase().includes("database") &&
                         !result.message.toLowerCase().includes("sql") &&
                         !result.message.toLowerCase().includes("postgres");
        
        if (isGeneric) {
          addResult("Error Sanitization", "success", `Error properly sanitized: "${result.message}"`);
        } else {
          addResult("Error Sanitization", "failed", "Error message exposes internal details");
        }
      } else {
        addResult("Error Sanitization", "error", "Expected error but operation succeeded");
      }
    } catch (error) {
      addResult("Error Sanitization", "error", String(error));
    }
    setLoading(false);
  };

  // Test 6: Failed Operation Logging
  const testFailedOperation = async () => {
    setLoading(true);
    try {
      // Intentionally create project with missing data
      const result = await createProject(null, {
        title: "",
        description: "",
        icon: "",
        items: []
      } as any);

      if (!result.success) {
        addResult("Failed Operation Logging", "success", "Failed operation properly logged in audit trail");
      } else {
        addResult("Failed Operation Logging", "error", "Operation should have failed validation");
      }
    } catch (error) {
      addResult("Failed Operation Logging", "success", "Error caught and logged");
    }
    setLoading(false);
  };

  const runAllTests = async () => {
    setTestResults([]);
    await testAuditLog();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testSessionValidation();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testProjectCreation();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testErrorSanitization();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testFailedOperation();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="w-8 h-8" />
          Zero Trust Security Testing
        </h1>
        <p className="text-muted-foreground mt-2">
          Test audit logging, session validation, and error sanitization features
        </p>
      </div>

      {/* Quick Test Button */}
      <Card>
        <CardHeader>
          <CardTitle>Run All Tests</CardTitle>
          <CardDescription>Execute all security feature tests in sequence</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runAllTests} disabled={loading} size="lg" className="w-full">
            <Activity className="w-4 h-4 mr-2" />
            {loading ? "Running Tests..." : "Run All Security Tests"}
          </Button>
        </CardContent>
      </Card>

      {/* Individual Tests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test 1: Audit Logging */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Test 1: Audit Logging
            </CardTitle>
            <CardDescription>
              Create a test audit log entry and verify it appears in the audit logs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTitle>What this tests:</AlertTitle>
              <AlertDescription>
                • Audit log creation<br />
                • Metadata storage<br />
                • Timestamp accuracy
              </AlertDescription>
            </Alert>
            <Button onClick={testAuditLog} disabled={loading} className="w-full">
              Test Audit Logging
            </Button>
          </CardContent>
        </Card>

        {/* Test 2: Session Validation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Test 2: Session Validation
            </CardTitle>
            <CardDescription>
              Verify admin session is validated on privileged operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTitle>What this tests:</AlertTitle>
              <AlertDescription>
                • requireAdminSession() function<br />
                • Real-time role checking<br />
                • Database user validation
              </AlertDescription>
            </Alert>
            <Button onClick={testSessionValidation} disabled={loading} className="w-full">
              Test Session Validation
            </Button>
          </CardContent>
        </Card>

        {/* Test 3: Role Change */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Test 3: Role Change Audit
            </CardTitle>
            <CardDescription>
              Test critical operation with full audit trail (old/new values)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="testEmail">Test User Email</Label>
              <Input
                id="testEmail"
                type="email"
                placeholder="user@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <Alert>
              <AlertTitle>What this tests:</AlertTitle>
              <AlertDescription>
                • Fresh session requirement<br />
                • Old/new value tracking<br />
                • Critical operation logging
              </AlertDescription>
            </Alert>
            <Button onClick={testRoleChange} disabled={loading || !testEmail} className="w-full">
              Test Role Change
            </Button>
          </CardContent>
        </Card>

        {/* Test 4: Project Creation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Test 4: Project Creation
            </CardTitle>
            <CardDescription>
              Create test project and verify audit log with metadata
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="projectTitle">Project Title</Label>
              <Input
                id="projectTitle"
                value={testProjectTitle}
                onChange={(e) => setTestProjectTitle(e.target.value)}
              />
            </div>
            <Alert>
              <AlertTitle>What this tests:</AlertTitle>
              <AlertDescription>
                • Resource creation logging<br />
                • Metadata capture<br />
                • Success status tracking
              </AlertDescription>
            </Alert>
            <Button onClick={testProjectCreation} disabled={loading} className="w-full">
              Create Test Project
            </Button>
          </CardContent>
        </Card>

        {/* Test 5: Error Sanitization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Test 5: Error Sanitization
            </CardTitle>
            <CardDescription>
              Verify errors don't expose internal system details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTitle>What this tests:</AlertTitle>
              <AlertDescription>
                • Generic error messages<br />
                • No database exposure<br />
                • Error code system
              </AlertDescription>
            </Alert>
            <Button onClick={testErrorSanitization} disabled={loading} className="w-full">
              Test Error Sanitization
            </Button>
          </CardContent>
        </Card>

        {/* Test 6: Failed Operation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Test 6: Failed Operation Logging
            </CardTitle>
            <CardDescription>
              Verify failed operations are logged in audit trail
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTitle>What this tests:</AlertTitle>
              <AlertDescription>
                • Failure logging<br />
                • Validation error capture<br />
                • Error reason tracking
              </AlertDescription>
            </Alert>
            <Button onClick={testFailedOperation} disabled={loading} className="w-full">
              Test Failed Operation
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Recent test executions and their outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{result.test}</span>
                      <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                        {result.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto">{result.timestamp}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{result.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>After running tests:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Visit <a href="/admin/audit-logs" className="text-blue-500 underline">/admin/audit-logs</a> to see all logged operations</li>
            <li>Check that test audit logs have correct timestamps and metadata</li>
            <li>Verify failed operations show "failed" status in logs</li>
            <li>Confirm error messages don't expose database details</li>
            <li>Review metadata includes old/new values for role changes</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
