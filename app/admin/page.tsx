import { isAdmin } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRoleManagement } from "@/components/user-role-management";
import Link from "next/link";
import { Database } from "lucide-react";

export default async function AdminPage() {
  const adminCheck = await isAdmin();
  if (!adminCheck) {
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
        {/* Database Tools Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Database Tools</CardTitle>
            <CardDescription className="text-muted-foreground">Access database utilities and testing functions</CardDescription>
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

      <Card className="mb-8 bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">User Management</CardTitle>
          <CardDescription className="text-muted-foreground">View and manage user roles.</CardDescription>
        </CardHeader>
        <CardContent>
          <UserRoleManagement />
        </CardContent>
      </Card>

      {/* Example of another admin section */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">System Settings</CardTitle>
          <CardDescription className="text-muted-foreground">Configure system-wide settings.</CardDescription>
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
