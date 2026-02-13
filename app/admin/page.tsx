import { isAdmin } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRoleManagement } from "@/components/user-role-management";
import Link from "next/link";
import { Database, Shield, Activity } from "lucide-react";

export default async function AdminPage() {
  // Assuming isAdmin is a valid function to protect the route
  if (!isAdmin) {
    return (
      <div className="container py-12">
        <p>Unauthorized</p>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {/* Zero Trust Security Card */}
        <Card className="border-green-500/50 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              Audit Logs
            </CardTitle>
            <CardDescription>View complete security audit trail</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/audit-logs" className="flex items-center justify-center gap-2">
                <Shield className="h-4 w-4" />
                View Audit Logs
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Track all admin actions, user changes, and system operations
            </p>
          </CardContent>
        </Card>

        {/* Security Testing Card */}
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Security Testing
            </CardTitle>
            <CardDescription>Test Zero Trust security features</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/security-test" className="flex items-center justify-center gap-2">
                <Activity className="h-4 w-4" />
                Run Security Tests
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Test audit logging, session validation, error sanitization
            </p>
          </CardContent>
        </Card>
        
        {/* Database Tools Card */}
        <Card>
          <CardHeader>
            <CardTitle>Database Tools</CardTitle>
            <CardDescription>Access database utilities and testing functions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button asChild className="w-full">
                <Link href="/db-test" className="flex items-center justify-center gap-2">
                  <Database className="h-4 w-4" />
                  DB Test
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View and manage user roles.</CardDescription>
        </CardHeader>
        <CardContent>
          <UserRoleManagement />
        </CardContent>
      </Card>

      {/* Example of another admin section */}
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>Configure system-wide settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input id="siteName" defaultValue="CyberApp" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Admin Email</Label>
              <Input id="adminEmail" type="email" defaultValue="admin@cyberapp.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
              <Select defaultValue="disabled">
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enabled">Enabled</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">Save Settings</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
