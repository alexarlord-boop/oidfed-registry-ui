import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2, AlertCircle, RefreshCw, ExternalLink } from "lucide-react";
import { useListSubordinates, useChangeSubordinateStatus } from "../../../../generated/api/apiComponents";
import { useQueryClient } from "@tanstack/react-query";
import { ENTITY_STATUS, ENTITY_TYPE_LABELS } from "@/types/constants";
import { RequireRole } from "@/components/auth/RequireRole";
import { UserRole } from "@/types/auth";
import type { Schemas } from "../../../../generated/api/apiSchemas";

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

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Entity Approvals</h1>
            <p className="text-muted-foreground">
              Review and approve or reject pending entity registrations
            </p>
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
          <div className="grid gap-4">
            {entities.map((entity: Schemas.Subordinate) => (
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
