"use client";

import { useEffect, useState } from "react";
import { getAuditLogs, getAuditStats } from "@/app/actions/audit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Activity, AlertTriangle, CheckCircle, XCircle, RefreshCw } from "lucide-react";

type AuditLog = {
  id: number;
  userId: string;
  userEmail: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  status: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: any;
  createdAt: Date;
};

type AuditStats = {
  total: number;
  recent: number;
  byStatus: Array<{ status: string; count: number }>;
  topActions: Array<{ action: string; count: number }>;
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");

  const limit = 20;

  const loadLogs = async () => {
    setLoading(true);
    try {
      const result = await getAuditLogs({
        limit,
        offset: page * limit,
        action: actionFilter || undefined,
        status: statusFilter || undefined,
        userId: userIdFilter || undefined,
      });

      if (result.success && result.data) {
        setLogs(result.data.logs as AuditLog[]);
        setTotal(result.data.total);
      } else {
        console.error("Failed to load logs:", result.error);
        setLogs([]);
        setTotal(0);
      }
    } catch (error) {
      console.error("Error loading logs:", error);
      setLogs([]);
      setTotal(0);
    }
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const result = await getAuditStats();
      if (result.success && result.data) {
        setStats(result.data as AuditStats);
      } else {
        console.error("Failed to load stats:", result.error);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  useEffect(() => {
    loadLogs();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, actionFilter, statusFilter, userIdFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Success</Badge>;
      case "failed":
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case "denied":
        return <Badge className="bg-yellow-500"><AlertTriangle className="w-3 h-3 mr-1" />Denied</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Audit Logs
          </h1>
          <p className="text-muted-foreground mt-2">
            Zero Trust Security - Complete audit trail of all system operations
          </p>
        </div>
        <Button onClick={() => { loadLogs(); loadStats(); }} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Last 24 Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recent.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.byStatus.length > 0 
                  ? Math.round((stats.byStatus.find(s => s.status === 'success')?.count || 0) / stats.total * 100)
                  : 0}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Failed + Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {stats.byStatus
                  .filter(s => s.status === 'failed' || s.status === 'denied')
                  .reduce((sum, s) => sum + s.count, 0)
                  .toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter audit logs by action, status, or user</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="action">Action</Label>
              <Input
                id="action"
                placeholder="e.g., PROJECT_CREATE"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="denied">Denied</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="userId">User Email</Label>
              <Input
                id="userId"
                placeholder="user@example.com"
                value={userIdFilter}
                onChange={(e) => setUserIdFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => setPage(0)}
              variant="outline"
            >
              Apply Filters
            </Button>
            <Button
              onClick={() => {
                setActionFilter("");
                setStatusFilter("");
                setUserIdFilter("");
                setPage(0);
              }}
              variant="ghost"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>
            Showing {page * limit + 1} - {Math.min((page + 1) * limit, total)} of {total} logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Metadata</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No audit logs found
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-xs">
                            {formatDate(log.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{log.userEmail}</div>
                            <div className="text-xs text-muted-foreground">{log.userId}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.action}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{log.resourceType}</div>
                            {log.resourceId && (
                              <div className="text-xs text-muted-foreground">ID: {log.resourceId}</div>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(log.status)}</TableCell>
                          <TableCell>
                            {log.metadata && (
                              <details className="cursor-pointer">
                                <summary className="text-xs text-blue-500">View JSON</summary>
                                <pre className="text-xs mt-2 p-2 bg-muted rounded max-w-md overflow-auto">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </details>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <Button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  variant="outline"
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page + 1} of {Math.ceil(total / limit)}
                </span>
                <Button
                  onClick={() => setPage(page + 1)}
                  disabled={(page + 1) * limit >= total}
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
