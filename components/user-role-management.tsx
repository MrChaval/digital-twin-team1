"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Crown } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { getUsers, setUserRole } from "@/app/actions/admin";
import { UserRole, User } from "@/lib/types";

export function UserRoleManagement() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Fetch users when component mounts using server action
  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoadingUsers(true);
        const result = await getUsers();
        
        if (result.data && result.data.users) {
          setUsers(result.data.users);
        } else {
          console.error("Failed to load users:", result.errors || result.message);
          toast({
            title: "Error",
            description: result.message || "Failed to load users",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error loading users:", error);
        toast({
          title: "Error",
          description: "Failed to load users. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoadingUsers(false);
      }
    }
    
    fetchUsers();
  }, [isLoading]); // Reload after updates

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Use server action
      const result = await setUserRole(email, role);

      // Check the status field from ActionState
      if (result.status === "success") {
        toast({
          title: "Success",
          description: result.message || `User ${email} role updated to ${role}`,
        });
        // Reset form
        setEmail("");
        // Optionally trigger user list refresh if not handled by useEffect dependency
        // fetchUsers(); // Or rely on isLoading changing in useEffect dependency array
      } else {
        // Handle error status
        throw new Error(result.message || "Failed to update user role");
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user role",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Role assignment form */}
      <Card>
        <CardHeader>
          <CardTitle>User Role Management</CardTitle>
          <CardDescription>
            Assign admin privileges to other users by email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm font-medium">
                User Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="role" className="text-sm font-medium">
                Role
              </label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as UserRole)}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update User Role"}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* User list table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Users</CardTitle>
          <CardDescription>
            All users in the system and their roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
            <div className="text-center py-6">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-6">No users found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Date Registered</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.name || "—"}</TableCell>
                    <TableCell>
                      {user.role === "admin" ? (
                        <Badge className="bg-primary">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="outline">User</Badge>
                      )}
                    </TableCell>
                    <TableCell>{user.createdAt ? formatDate(user.createdAt) : "—"}</TableCell>
                    <TableCell>
                      {user.isFirstUser && (
                        <div className="flex items-center text-amber-500 font-medium">
                          <Crown className="h-4 w-4 mr-1" />
                          First User (Auto-Admin)
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
