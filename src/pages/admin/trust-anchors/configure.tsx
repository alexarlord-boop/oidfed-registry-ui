import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Key,
  Shield,
  FileText,
  Award,
  Loader2,
  Plus,
  Trash2,
  Info,
  AlertCircle,
  ExternalLink,
  Copy,
  CheckCircle2,
} from "lucide-react";
import {
  useGetEntityConfiguration,
  useGetKeys,
  useCreateKey,
  useRevokeKey,
  useListEntityConfigurationTrustMarks,
  useDeleteEntityConfigurationTrustMark,
} from "../../../../generated/api/apiComponents";
import { RequireRole } from "@/components/auth/RequireRole";
import { UserRole } from "@/types/auth";
import { PageHeader } from "@/components/page-header";
import type * as Schemas from "../../../../generated/api/apiSchemas";
import { useQueryClient } from "@tanstack/react-query";

export function ConfigureTrustAnchor() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);
  const [tmToDelete, setTmToDelete] = useState<string | null>(null);
  const [copiedKid, setCopiedKid] = useState<string | null>(null);

  // Fetch entity configuration
  const { data: entityConfig, isLoading: configLoading } = useGetEntityConfiguration({});
  const { data: keysResponse, isLoading: keysLoading } = useGetKeys({});
  const { data: trustMarks, isLoading: trustMarksLoading } = useListEntityConfigurationTrustMarks({});

  // Mutations
  const createKeyMutation = useCreateKey();
  const revokeKeyMutation = useRevokeKey();
  const deleteTrustMarkMutation = useDeleteEntityConfigurationTrustMark();

  const keys = keysResponse?.jwks || [];

  const handleGenerateKey = async () => {
    try {
      await createKeyMutation.mutateAsync({
        body: {
          alg: "ES256",
          kms: "filesystem",
        },
      });
      queryClient.invalidateQueries({ queryKey: ["getKeys"] });
    } catch (error) {
      console.error("Failed to generate key:", error);
    }
  };

  const handleDeleteKey = async (kid: string) => {
    try {
      await revokeKeyMutation.mutateAsync({
        pathParams: { kid },
        queryParams: { reason: "User deleted via UI" },
      });
      queryClient.invalidateQueries({ queryKey: ["getKeys"] });
      setKeyToDelete(null);
    } catch (error) {
      console.error("Failed to delete key:", error);
    }
  };

  const handleDeleteTrustMark = async (id: string) => {
    try {
      await deleteTrustMarkMutation.mutateAsync({
        pathParams: { trustMarkID: id },
      });
      queryClient.invalidateQueries({ queryKey: ["listEntityConfigurationTrustMarks"] });
      setTmToDelete(null);
    } catch (error) {
      console.error("Failed to delete trust mark:", error);
    }
  };

  const copyToClipboard = (text: string, kid: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKid(kid);
    setTimeout(() => setCopiedKid(null), 2000);
  };

  const formatTimestamp = (timestamp: number | null | undefined) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (configLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <RequireRole role={UserRole.ADMIN}>
      <div className="space-y-6">
        <PageHeader
          title="Trust Anchor Configuration"
          description="Manage this registry's entity configuration, keys, and trust marks"
        />

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Keys</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{keys.length}</div>
              <p className="text-xs text-muted-foreground">Active signing keys</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trust Marks</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trustMarks?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Attached trust marks</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Metadata</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {entityConfig?.metadata ? Object.keys(entityConfig.metadata).length : 0}
              </div>
              <p className="text-xs text-muted-foreground">Entity types configured</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge variant="default" className="text-lg">
                Active
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">Trust Anchor operational</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="keys">Keys</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            <TabsTrigger value="trust-marks">Trust Marks</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Entity Configuration</CardTitle>
                <CardDescription>
                  Core configuration for this Trust Anchor instance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Entity ID</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-muted px-2 py-1 rounded flex-1">
                      {entityConfig?.sub || "Not configured"}
                    </code>
                    {entityConfig?.sub && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(entityConfig.sub, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <label className="text-sm font-medium">Issuer</label>
                  <code className="text-sm bg-muted px-2 py-1 rounded block mt-1">
                    {entityConfig?.iss || "Not configured"}
                  </code>
                </div>

                <div>
                  <label className="text-sm font-medium">Lifetime</label>
                  <div className="text-sm text-muted-foreground mt-1">
                    {entityConfig?.exp && entityConfig?.iat
                      ? `${entityConfig.exp - entityConfig.iat} seconds`
                      : "Not configured"}
                  </div>
                </div>

                {/* Authority Hints - Hidden with Info */}
                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Authority Hints
                    </label>
                    <div className="group relative">
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      <div className="hidden group-hover:block absolute z-10 w-64 p-2 bg-popover border rounded-md shadow-md text-xs -top-2 left-6">
                        Authority hints specify superior entities. For root Trust Anchors, this
                        field is typically empty. Only Intermediate Authorities have superiors.
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 italic">
                    (Root TA - no superiors)
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Keys Tab */}
          <TabsContent value="keys" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Signing Keys (JWKS)</CardTitle>
                  <CardDescription>Manage cryptographic keys for this Trust Anchor</CardDescription>
                </div>
                <Button onClick={handleGenerateKey} disabled={createKeyMutation.isPending}>
                  {createKeyMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Generate New Key
                </Button>
              </CardHeader>
              <CardContent>
                {keysLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : keys.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No keys configured. Generate your first signing key to begin.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {keys.map((key: Schemas.ManagedJWK) => (
                      <Card key={key.kid}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-3 flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{key.kty}</Badge>
                                <Badge variant="secondary">{key.alg}</Badge>
                                {key.use && <Badge variant="outline">{key.use}</Badge>}
                              </div>

                              <div className="grid gap-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground w-24">Key ID:</span>
                                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1">
                                    {key.kid}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(key.kid, key.kid)}
                                  >
                                    {copiedKid === key.kid ? (
                                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>

                                {key.kms && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground w-24">KMS:</span>
                                    <span>{key.kms}</span>
                                  </div>
                                )}

                                {key.iat && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground w-24">Created:</span>
                                    <span>{formatTimestamp(key.iat)}</span>
                                  </div>
                                )}

                                {key.exp && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground w-24">Expires:</span>
                                    <span>{formatTimestamp(key.exp)}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setKeyToDelete(key.kid)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metadata Tab */}
          <TabsContent value="metadata" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Federation Entity Metadata</CardTitle>
                  <CardDescription>
                    Metadata for this Trust Anchor's federation_entity type
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => navigate("/admin/trust-anchors/configure/metadata/edit")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Edit Metadata
                </Button>
              </CardHeader>
              <CardContent>
                {entityConfig?.metadata?.federation_entity ? (
                  <div className="space-y-4">
                    {Object.entries(entityConfig.metadata.federation_entity).map(([key, value]) => (
                      <div key={key}>
                        <label className="text-sm font-medium capitalize">
                          {key.replace(/_/g, " ")}
                        </label>
                        <div className="text-sm text-muted-foreground mt-1">
                          {Array.isArray(value) ? (
                            <ul className="list-disc list-inside">
                              {value.map((item, idx) => (
                                <li key={idx}>{String(item)}</li>
                              ))}
                            </ul>
                          ) : (
                            String(value)
                          )}
                        </div>
                        <Separator className="mt-3" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      No metadata configured. Click "Edit Metadata" to add organization
                      information, contacts, and other details.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trust Marks Tab */}
          <TabsContent value="trust-marks" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Trust Marks</CardTitle>
                  <CardDescription>
                    Trust marks attached to this Trust Anchor's entity configuration
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => navigate("/admin/trust-anchors/configure/trust-marks/add")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Attach Trust Mark
                </Button>
              </CardHeader>
              <CardContent>
                {trustMarksLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !trustMarks || trustMarks.length === 0 ? (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      No trust marks attached. Trust marks provide additional attestations about
                      this Trust Anchor.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {trustMarks.map((tm: Schemas.TrustMark) => (
                      <Card key={tm.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div>
                                <label className="text-sm font-medium">Type</label>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {tm.trust_mark_type}
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Issuer</label>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {tm.trust_mark_issuer}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setTmToDelete(String(tm.id))}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Key Confirmation Dialog */}
        <AlertDialog open={!!keyToDelete} onOpenChange={() => setKeyToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Signing Key?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the key <code className="bg-muted px-1">{keyToDelete}</code>.
                Any signatures made with this key will no longer be verifiable. This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => keyToDelete && handleDeleteKey(keyToDelete)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {revokeKeyMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Delete Key
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Trust Mark Confirmation Dialog */}
        <AlertDialog open={!!tmToDelete} onOpenChange={() => setTmToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Trust Mark?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the trust mark from this entity's configuration. This action can be
                reversed by re-attaching the trust mark.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => tmToDelete && handleDeleteTrustMark(tmToDelete)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteTrustMarkMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </RequireRole>
  );
}
