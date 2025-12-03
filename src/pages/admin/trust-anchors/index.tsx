import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Globe2, Settings } from "lucide-react";

// Mock data for trust anchors
const mockTrustAnchors = [
  {
    id: "1",
    name: "Main Federation",
    entity_id: "https://federation.example.org",
    type: "Trust Anchor",
    status: "active",
    entities_count: 42,
    created_at: "2025-01-15T10:00:00Z",
  },
  {
    id: "2",
    name: "eduGAIN Interfederation",
    entity_id: "https://edugain.org",
    type: "Interfederation Aggregator",
    status: "active",
    entities_count: 156,
    created_at: "2025-02-20T14:30:00Z",
  },
  {
    id: "3",
    name: "Test Federation",
    entity_id: "https://test.federation.example.org",
    type: "Test Federation",
    status: "active",
    entities_count: 8,
    created_at: "2025-03-10T09:15:00Z",
  },
  {
    id: "4",
    name: "Training Federation",
    entity_id: "https://training.federation.example.org",
    type: "Training Federation",
    status: "active",
    entities_count: 5,
    created_at: "2025-04-05T11:45:00Z",
  },
];

function getTypeColor(type: string) {
  switch (type) {
    case "Trust Anchor":
      return "default";
    case "Interfederation Aggregator":
      return "secondary";
    case "Test Federation":
      return "outline";
    case "Training Federation":
      return "outline";
    default:
      return "outline";
  }
}

export function AdminTrustAnchors() {
  const [trustAnchors] = useState(mockTrustAnchors);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Trust Anchor
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Globe2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trustAnchors.length}</div>
            <p className="text-xs text-muted-foreground">
              Trust anchors configured
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Globe2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trustAnchors.filter((ta) => ta.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently operational
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entities</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trustAnchors.reduce((sum, ta) => sum + ta.entities_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all federations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interfederations</CardTitle>
            <Globe2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trustAnchors.filter((ta) => ta.type === "Interfederation Aggregator").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Connected aggregators
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configured Trust Anchors</CardTitle>
          <CardDescription>
            View and manage all trust anchors and federations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Entities</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trustAnchors.map((ta) => (
                  <TableRow key={ta.id}>
                    <TableCell className="font-medium">{ta.name}</TableCell>
                    <TableCell className="font-mono text-xs">{ta.entity_id}</TableCell>
                    <TableCell>
                      <Badge variant={getTypeColor(ta.type)}>{ta.type}</Badge>
                    </TableCell>
                    <TableCell>{ta.entities_count}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-50 border-green-200"
                      >
                        {ta.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Configure
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common trust anchor management tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Button variant="outline" className="justify-start h-auto p-4">
            <div className="text-left">
              <div className="font-semibold">Add Federation TA</div>
              <div className="text-sm text-muted-foreground">
                Register a new federation trust anchor
              </div>
            </div>
          </Button>
          <Button variant="outline" className="justify-start h-auto p-4">
            <div className="text-left">
              <div className="font-semibold">Add Interfederation IA</div>
              <div className="text-sm text-muted-foreground">
                Connect to an interfederation aggregator
              </div>
            </div>
          </Button>
          <Button variant="outline" className="justify-start h-auto p-4">
            <div className="text-left">
              <div className="font-semibold">Create Test Environment</div>
              <div className="text-sm text-muted-foreground">
                Set up a test federation for development
              </div>
            </div>
          </Button>
          <Button variant="outline" className="justify-start h-auto p-4">
            <div className="text-left">
              <div className="font-semibold">Create Training Environment</div>
              <div className="text-sm text-muted-foreground">
                Set up a training federation for demos
              </div>
            </div>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminTrustAnchors;
