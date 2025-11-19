import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, XCircle, Clock, Users, Globe } from "lucide-react";

// Mock data for pending approvals
const mockPendingUsers = [
  {
    id: "3",
    username: "jane.smith",
    email: "jane.smith@research.org",
    full_name: "Jane Smith",
    organization: "Research Institute",
    type: "user",
    created_at: "2025-11-19T09:15:00Z",
  },
  {
    id: "4",
    username: "bob.wilson",
    email: "bob.wilson@college.edu",
    full_name: "Bob Wilson",
    organization: "Technical College",
    type: "user",
    created_at: "2025-11-18T16:20:00Z",
  },
];

const mockPendingEntities = [
  {
    id: "e1",
    entity_id: "https://sp.example.edu",
    organization: "Example University",
    type: "entity",
    entity_type: "Service Provider",
    submitted_by: "john.doe",
    created_at: "2025-11-19T10:30:00Z",
  },
  {
    id: "e2",
    entity_id: "https://idp.research.org",
    organization: "Research Institute",
    type: "entity",
    entity_type: "Identity Provider",
    submitted_by: "jane.smith",
    created_at: "2025-11-18T14:45:00Z",
  },
];

export function AdminApprovals() {
  const navigate = useNavigate();
  const [pendingUsers] = useState(mockPendingUsers);
  const [pendingEntities] = useState(mockPendingEntities);

  const handleApproveUser = (id: string) => {
    console.log("Approving user:", id);
    // TODO: Implement API call
  };

  const handleRejectUser = (id: string) => {
    console.log("Rejecting user:", id);
    // TODO: Implement API call
  };

  const handleApproveEntity = (id: string) => {
    console.log("Approving entity:", id);
    // TODO: Implement API call
  };

  const handleRejectEntity = (id: string) => {
    console.log("Rejecting entity:", id);
    // TODO: Implement API call
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Approval Queue</h1>
        <p className="text-muted-foreground">
          Review and approve pending user registrations and entity submissions
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Entities</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingEntities.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingUsers.length + pendingEntities.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Requiring action
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">
            User Registrations ({pendingUsers.length})
          </TabsTrigger>
          <TabsTrigger value="entities">
            Entity Submissions ({pendingEntities.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending User Registrations</CardTitle>
              <CardDescription>
                Review and approve user account requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingUsers.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.username}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.organization}</TableCell>
                          <TableCell>
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/admin/users/${user.id}`)}
                            >
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectUser(user.id)}
                            >
                              <XCircle className="mr-1 h-3 w-3" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApproveUser(user.id)}
                            >
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Approve
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No pending user registrations
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Entity Submissions</CardTitle>
              <CardDescription>
                Review and approve entity registration requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingEntities.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Entity ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Submitted By</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingEntities.map((entity) => (
                        <TableRow key={entity.id}>
                          <TableCell className="font-medium font-mono text-xs">
                            {entity.entity_id}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{entity.entity_type}</Badge>
                          </TableCell>
                          <TableCell>{entity.organization}</TableCell>
                          <TableCell>{entity.submitted_by}</TableCell>
                          <TableCell>
                            {new Date(entity.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectEntity(entity.id)}
                            >
                              <XCircle className="mr-1 h-3 w-3" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApproveEntity(entity.id)}
                            >
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Approve
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No pending entity submissions
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminApprovals;
