import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Search, RefreshCw, ExternalLink, Trash2 } from "lucide-react";
import { useListSubordinates, useChangeSubordinateStatus } from "../../../../generated/api/apiComponents";
import { useQueryClient } from "@tanstack/react-query";
import { ENTITY_STATUS, ENTITY_STATUS_LABELS, ENTITY_TYPE_LABELS, ENTITY_TYPES } from "@/types/constants";
import { RequireRole } from "@/components/auth/RequireRole";
import { UserRole } from "@/types/auth";
import type { Schemas } from "../../../../generated/api/apiSchemas";

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case ENTITY_STATUS.APPROVED:
      return "default";
    case ENTITY_STATUS.PENDING:
      return "secondary";
    case ENTITY_STATUS.REJECTED:
      return "destructive";
    case ENTITY_STATUS.INACTIVE:
      return "outline";
    default:
      return "secondary";
  }
}

export function AdminEntities() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterEntityType, setFilterEntityType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Build query params based on filters
  const queryParams: { status?: string; entity_type?: string } = {};
  if (filterStatus !== "all") {
    queryParams.status = filterStatus;
  }
  if (filterEntityType !== "all") {
    queryParams.entity_type = filterEntityType;
  }

  const { data: entities, isLoading, refetch } = useListSubordinates({
    queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined,
  });

  const changeStatusMutation = useChangeSubordinateStatus({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listSubordinates'] });
    },
  });

  const handleSoftDelete = async (entity: Schemas.Subordinate) => {
    if (!confirm(`Are you sure you want to deactivate ${entity.entity_id}?`)) {
      return;
    }

    try {
      await changeStatusMutation.mutateAsync({
        pathParams: { subordinateID: entity.id },
        body: { status: ENTITY_STATUS.INACTIVE },
      });
    } catch (err: any) {
      alert(`Failed to deactivate entity: ${err.message}`);
      console.error('Failed to deactivate entity:', err);
    }
  };

  // Filter entities by search query (client-side)
  const filteredEntities = entities?.filter((entity: Schemas.Subordinate) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      entity.entity_id.toLowerCase().includes(query) ||
      entity.id.toLowerCase().includes(query) ||
      entity.description?.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <RequireRole roles={[UserRole.ADMIN, UserRole.TECHNICAL_CONTACT]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Entity Management</h1>
            <p className="text-muted-foreground">
              Manage all registered entities in the federation
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => navigate("/admin/entities/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Register Entity
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by ID or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value={ENTITY_STATUS.PENDING}>{ENTITY_STATUS_LABELS[ENTITY_STATUS.PENDING]}</SelectItem>
                    <SelectItem value={ENTITY_STATUS.APPROVED}>{ENTITY_STATUS_LABELS[ENTITY_STATUS.APPROVED]}</SelectItem>
                    <SelectItem value={ENTITY_STATUS.REJECTED}>{ENTITY_STATUS_LABELS[ENTITY_STATUS.REJECTED]}</SelectItem>
                    <SelectItem value={ENTITY_STATUS.INACTIVE}>{ENTITY_STATUS_LABELS[ENTITY_STATUS.INACTIVE]}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="entity-type">Entity Type</Label>
                <Select value={filterEntityType} onValueChange={setFilterEntityType}>
                  <SelectTrigger id="entity-type">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value={ENTITY_TYPES.TRUST_ANCHOR}>{ENTITY_TYPE_LABELS[ENTITY_TYPES.TRUST_ANCHOR]}</SelectItem>
                    <SelectItem value={ENTITY_TYPES.INTERMEDIATE_AUTHORITY}>{ENTITY_TYPE_LABELS[ENTITY_TYPES.INTERMEDIATE_AUTHORITY]}</SelectItem>
                    <SelectItem value={ENTITY_TYPES.TEST_FEDERATION}>{ENTITY_TYPE_LABELS[ENTITY_TYPES.TEST_FEDERATION]}</SelectItem>
                    <SelectItem value={ENTITY_TYPES.TRAINING_FEDERATION}>{ENTITY_TYPE_LABELS[ENTITY_TYPES.TRAINING_FEDERATION]}</SelectItem>
                    <SelectItem value={ENTITY_TYPES.OPENID_PROVIDER}>{ENTITY_TYPE_LABELS[ENTITY_TYPES.OPENID_PROVIDER]}</SelectItem>
                    <SelectItem value={ENTITY_TYPES.OPENID_RELYING_PARTY}>{ENTITY_TYPE_LABELS[ENTITY_TYPES.OPENID_RELYING_PARTY]}</SelectItem>
                    <SelectItem value={ENTITY_TYPES.FEDERATION_ENTITY}>{ENTITY_TYPE_LABELS[ENTITY_TYPES.FEDERATION_ENTITY]}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Entity List */}
        {!filteredEntities || filteredEntities.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-lg font-medium">No Entities Found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your filters or register a new entity
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            <div className="text-sm text-muted-foreground">
              Showing {filteredEntities.length} {filteredEntities.length === 1 ? 'entity' : 'entities'}
            </div>
            {filteredEntities.map((entity: Schemas.Subordinate) => (
              <Card key={entity.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1 min-w-0">
                      <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                        <span className="truncate">{entity.entity_id}</span>
                        <Badge variant={getStatusVariant(entity.status)}>
                          {ENTITY_STATUS_LABELS[entity.status] || entity.status}
                        </Badge>
                      </CardTitle>
                      {entity.description && (
                        <CardDescription>{entity.description}</CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2 text-sm">
                    <div className="flex gap-2 flex-wrap">
                      <span className="font-semibold min-w-[120px]">Entity Types:</span>
                      <div className="flex flex-wrap gap-1">
                        {entity.registered_entity_types?.map((type: string) => (
                          <Badge key={type} variant="outline">
                            {ENTITY_TYPE_LABELS[type] || type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="font-semibold min-w-[120px]">Entity ID:</span>
                      <a 
                        href={entity.entity_id}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 text-xs"
                      >
                        {entity.entity_id}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-semibold min-w-[120px]">Internal ID:</span>
                      <span className="text-muted-foreground font-mono text-xs">{entity.id}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/admin/entities/${entity.id}`)}
                    >
                      View Details
                    </Button>
                    {entity.status === ENTITY_STATUS.APPROVED && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSoftDelete(entity)}
                        disabled={changeStatusMutation.isPending}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Deactivate
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RequireRole>
  );
}
