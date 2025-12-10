import { useNavigate } from "react-router-dom";
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
import { Plus, Globe2, Settings, Loader2, ExternalLink } from "lucide-react";
import { useListSubordinates } from "../../../../generated/api/apiComponents";
import { ENTITY_TYPES, ENTITY_TYPE_LABELS, ENTITY_STATUS } from "@/types/constants";
import { RequireRole } from "@/components/auth/RequireRole";
import { UserRole } from "@/types/auth";
import type { Schemas } from "../../../../generated/api/apiSchemas";

// Trust Anchor entity types
const TA_ENTITY_TYPES = [
  ENTITY_TYPES.TRUST_ANCHOR,
  ENTITY_TYPES.INTERMEDIATE_AUTHORITY,
  ENTITY_TYPES.TEST_FEDERATION,
  ENTITY_TYPES.TRAINING_FEDERATION,
];

function getTypeColor(entityTypes: string[] | undefined): "default" | "secondary" | "outline" {
  if (!entityTypes || entityTypes.length === 0) return "outline";
  
  if (entityTypes.includes(ENTITY_TYPES.TRUST_ANCHOR)) return "default";
  if (entityTypes.includes(ENTITY_TYPES.INTERMEDIATE_AUTHORITY)) return "secondary";
  return "outline";
}

function getPrimaryType(entityTypes: string[] | undefined): string {
  if (!entityTypes || entityTypes.length === 0) return "Unknown";
  
  // Prioritize TA types
  if (entityTypes.includes(ENTITY_TYPES.TRUST_ANCHOR)) return ENTITY_TYPE_LABELS[ENTITY_TYPES.TRUST_ANCHOR] || 'Trust Anchor';
  if (entityTypes.includes(ENTITY_TYPES.INTERMEDIATE_AUTHORITY)) return ENTITY_TYPE_LABELS[ENTITY_TYPES.INTERMEDIATE_AUTHORITY] || 'Intermediate Authority';
  if (entityTypes.includes(ENTITY_TYPES.TEST_FEDERATION)) return ENTITY_TYPE_LABELS[ENTITY_TYPES.TEST_FEDERATION] || 'Test Federation';
  if (entityTypes.includes(ENTITY_TYPES.TRAINING_FEDERATION)) return ENTITY_TYPE_LABELS[ENTITY_TYPES.TRAINING_FEDERATION] || 'Training Federation';
  
  return (entityTypes[0] && ENTITY_TYPE_LABELS[entityTypes[0]]) || entityTypes[0] || 'Unknown';
}

export function AdminTrustAnchors() {
  const navigate = useNavigate();

  // Fetch all subordinates and filter for TA types (client-side filtering)
  const { data: allEntities, isLoading } = useListSubordinates({});

  // Filter for Trust Anchor related entity types
  const trustAnchors = allEntities?.filter((entity: Schemas.Subordinate) =>
    entity.registered_entity_types?.some((type: string) => TA_ENTITY_TYPES.includes(type as any))
  ) || [];

  const activeTrustAnchors = trustAnchors.filter((ta: Schemas.Subordinate) => ta.status === ENTITY_STATUS.APPROVED);
  const interfederations = trustAnchors.filter((ta: Schemas.Subordinate) =>
    ta.registered_entity_types?.includes(ENTITY_TYPES.INTERMEDIATE_AUTHORITY)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <RequireRole role={UserRole.ADMIN}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Trust Anchors</h1>
            <p className="text-muted-foreground mt-1">
              Manage trust anchors, federations, and subordinate entities
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/admin/trust-anchors/configure")}>
              <Settings className="mr-2 h-4 w-4" />
              Configure This TA
            </Button>
            <Button onClick={() => navigate("/admin/entities/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Subordinate
            </Button>
          </div>
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
            <div className="text-2xl font-bold">{activeTrustAnchors.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently operational
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">All Entities</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allEntities?.length || 0}</div>
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
            <div className="text-2xl font-bold">{interfederations.length}</div>
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
            Subordinate entities registered under this Trust Anchor
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trustAnchors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Globe2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No Subordinates Registered</p>
              <p className="text-sm text-muted-foreground mt-2 mb-4">
                Register your first subordinate entity (OP, RP, or IA) to begin
              </p>
              <Button onClick={() => navigate("/admin/entities/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Add Subordinate
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entity ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trustAnchors.map((ta: Schemas.Subordinate) => (
                    <TableRow key={ta.id}>
                      <TableCell>
                        <a
                          href={ta.entity_id}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          {ta.entity_id}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        {ta.description && (
                          <p className="text-xs text-muted-foreground mt-1">{ta.description}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTypeColor(ta.registered_entity_types)}>
                          {getPrimaryType(ta.registered_entity_types)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={ta.status === ENTITY_STATUS.APPROVED ? "default" : "secondary"}
                        >
                          {ta.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/entities/${ta.id}`)}
                        >
                          Configure
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Register different types of trust anchors
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Button
            variant="outline"
            className="justify-start h-auto p-4"
            onClick={() => navigate("/admin/entities/new")}
          >
            <div className="text-left">
              <div className="font-semibold">Add Federation TA</div>
              <div className="text-sm text-muted-foreground">
                Register a new federation trust anchor
              </div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="justify-start h-auto p-4"
            onClick={() => navigate("/admin/entities/new")}
          >
            <div className="text-left">
              <div className="font-semibold">Add Interfederation IA</div>
              <div className="text-sm text-muted-foreground">
                Connect to an interfederation aggregator
              </div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="justify-start h-auto p-4"
            onClick={() => navigate("/admin/entities/new")}
          >
            <div className="text-left">
              <div className="font-semibold">Create Test Environment</div>
              <div className="text-sm text-muted-foreground">
                Set up a test federation for development
              </div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="justify-start h-auto p-4"
            onClick={() => navigate("/admin/entities/new")}
          >
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
    </RequireRole>
  );
}

export default AdminTrustAnchors;
