import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2, AlertCircle, RefreshCw, ExternalLink, Globe2 } from "lucide-react";
import { useListSubordinates, useChangeSubordinateStatus } from "../../../../generated/api/apiComponents";
import { useQueryClient } from "@tanstack/react-query";
import { ENTITY_STATUS, ENTITY_TYPE_LABELS, ENTITY_TYPES } from "@/types/constants";
import { RequireRole } from "@/components/auth/RequireRole";
import { UserRole } from "@/types/auth";
import type { Schemas } from "../../../../generated/api/apiSchemas";
import { PageHeader } from "@/components/page-header";

// Trust Anchor entity types
const TA_ENTITY_TYPES = [
  ENTITY_TYPES.TRUST_ANCHOR,
  ENTITY_TYPES.INTERMEDIATE_AUTHORITY,
  ENTITY_TYPES.TEST_FEDERATION,
  ENTITY_TYPES.TRAINING_FEDERATION,
];

// Helper function to check if entity is a TA
const isTrustAnchorType = (entityTypes: string[] | undefined): boolean => {
  return entityTypes?.some((type) => TA_ENTITY_TYPES.includes(type as any)) || false;
};

export function AdminEntityApprovals() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch pending entities
  const { data: entities, isLoading, refetch } = useListSubordinates({
    queryParams: {
      status: ENTITY_STATUS.PENDING,
    },
  });

  const changeStatusMutation = useChangeSubordinateStatus({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listSubordinates'] });
    },
  });

  // Separate TA and non-TA pending requests
  const trustAnchorRequests = entities?.filter((entity: Schemas.Subordinate) => 
    isTrustAnchorType(entity.registered_entity_types)
  ) || [];
  
  const otherRequests = entities?.filter((entity: Schemas.Subordinate) => 
    !isTrustAnchorType(entity.registered_entity_types)
  ) || [];

  const handleApprove = async (entity: Schemas.Subordinate) => {
    try {
      setError(null);
      setSuccess(null);

      await changeStatusMutation.mutateAsync({
        pathParams: { subordinateID: entity.id },
        body: { status: ENTITY_STATUS.APPROVED },
      });

      setSuccess(`Entity ${entity.entity_id} approved successfully`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to approve entity');
      console.error('Failed to approve entity:', err);
    }
  };

  const handleReject = async (entity: Schemas.Subordinate) => {
    try {
      setError(null);
      setSuccess(null);

      await changeStatusMutation.mutateAsync({
        pathParams: { subordinateID: entity.id },
        body: { status: ENTITY_STATUS.REJECTED },
      });

      setSuccess(`Entity ${entity.entity_id} rejected`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reject entity');
      console.error('Failed to reject entity:', err);
    }
  };

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
        {error && (
          <Alert variant="destructive" className="fixed top-4 right-4 w-auto max-w-md z-50 shadow-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="fixed top-4 right-4 w-auto max-w-md z-50 shadow-lg border-green-500 bg-green-50 dark:bg-green-900">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-100">{success}</AlertDescription>
          </Alert>
        )}

        <PageHeader
          title="Pending Approvals"
          description="Review and approve entity registration requests from technical contacts"
        />

        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Trust Anchors: {trustAnchorRequests.length}</span>
            <span>Other Entities: {otherRequests.length}</span>
            <span>Total Pending: {entities?.length || 0}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {!entities || entities.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No Pending Entities</p>
              <p className="text-sm text-muted-foreground mt-2">
                All entity registrations have been processed
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Trust Anchor Requests Section */}
            {trustAnchorRequests.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Globe2 className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Trust Anchor Requests</h2>
                  <Badge variant="secondary">{trustAnchorRequests.length}</Badge>
                </div>
                <div className="grid gap-4">
                  {trustAnchorRequests.map((entity: Schemas.Subordinate) => (
                    <Card key={entity.id} className="border-l-4 border-l-primary">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                              {entity.entity_id}
                              <Badge variant="secondary">{entity.status}</Badge>
                              <Badge variant="outline">
                                <Globe2 className="h-3 w-3 mr-1" />
                                TA Request
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
                          <div className="flex gap-2">
                            <span className="font-semibold min-w-[120px]">Entity ID:</span>
                            <a 
                              href={entity.entity_id}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              {entity.entity_id}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          <div className="flex gap-2">
                            <span className="font-semibold min-w-[120px]">Entity Types:</span>
                            <div className="flex flex-wrap gap-1">
                              {entity.registered_entity_types?.map((type: string) => (
                                <Badge key={type} variant={TA_ENTITY_TYPES.includes(type as any) ? "default" : "outline"}>
                                  {ENTITY_TYPE_LABELS[type] || type}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span className="font-semibold min-w-[120px]">Internal ID:</span>
                            <span className="text-muted-foreground font-mono text-xs">{entity.id}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(entity)}
                            disabled={changeStatusMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(entity)}
                            disabled={changeStatusMutation.isPending}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/admin/entities/${entity.id}`)}
                            disabled={changeStatusMutation.isPending}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Other Entity Requests Section */}
            {otherRequests.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">Other Entity Requests</h2>
                  <Badge variant="secondary">{otherRequests.length}</Badge>
                </div>
                <div className="grid gap-4">
                  {otherRequests.map((entity: Schemas.Subordinate) => (
              <Card key={entity.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {entity.entity_id}
                        <Badge variant="secondary">{entity.status}</Badge>
                      </CardTitle>
                      {entity.description && (
                        <CardDescription>{entity.description}</CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2 text-sm">
                    <div className="flex gap-2">
                      <span className="font-semibold min-w-[120px]">Entity ID:</span>
                      <a 
                        href={entity.entity_id}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        {entity.entity_id}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-semibold min-w-[120px]">Entity Types:</span>
                      <div className="flex flex-wrap gap-1">
                        {entity.registered_entity_types?.map((type: string) => (
                          <Badge key={type} variant="outline">
                            {ENTITY_TYPE_LABELS[type] || type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-semibold min-w-[120px]">Internal ID:</span>
                      <span className="text-muted-foreground font-mono text-xs">{entity.id}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleApprove(entity)}
                      disabled={changeStatusMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(entity)}
                      disabled={changeStatusMutation.isPending}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/admin/entities/${entity.id}`)}
                      disabled={changeStatusMutation.isPending}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Approval Workflow:</strong> Approving an entity will change its status to "approved" and make it active in the federation. Rejecting will mark it as "rejected" and prevent it from being used.
          </AlertDescription>
        </Alert>
      </div>
    </RequireRole>
  );
}
