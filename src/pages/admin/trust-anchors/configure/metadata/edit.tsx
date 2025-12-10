import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Save, X } from "lucide-react";
import { MultiValueInput } from "@/components/ui/multi-value-input";
import {
  useGetEntityConfigurationMetadata,
  useUpdateEntityConfigurationMetadata,
} from "../../../../../../generated/api/apiComponents";
import { RequireRole } from "@/components/auth/RequireRole";
import { UserRole } from "@/types/auth";
import { PageHeader } from "@/components/page-header";
import type * as Schemas from "../../../../../../generated/api/apiSchemas";
import { useQueryClient } from "@tanstack/react-query";

type FederationEntityMetadata = {
  organization_name?: string;
  display_name?: string;
  description?: string;
  keywords?: string[];
  contacts?: string[];
  logo_uri?: string;
  policy_uri?: string;
  information_uri?: string;
  organization_uri?: string;
};

export function EditMetadata() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: currentMetadata, isLoading } = useGetEntityConfigurationMetadata({});
  const updateMutation = useUpdateEntityConfigurationMetadata();

  const [formData, setFormData] = useState<FederationEntityMetadata>({
    organization_name: "",
    display_name: "",
    description: "",
    keywords: [],
    contacts: [],
    logo_uri: "",
    policy_uri: "",
    information_uri: "",
    organization_uri: "",
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load existing metadata
  useEffect(() => {
    if (currentMetadata?.federation_entity) {
      const fedEntityMetadata = currentMetadata.federation_entity as FederationEntityMetadata;
      setFormData({
        organization_name: fedEntityMetadata.organization_name || "",
        display_name: fedEntityMetadata.display_name || "",
        description: fedEntityMetadata.description || "",
        keywords: fedEntityMetadata.keywords || [],
        contacts: fedEntityMetadata.contacts || [],
        logo_uri: fedEntityMetadata.logo_uri || "",
        policy_uri: fedEntityMetadata.policy_uri || "",
        information_uri: fedEntityMetadata.information_uri || "",
        organization_uri: fedEntityMetadata.organization_uri || "",
      });
    }
  }, [currentMetadata]);

  const validateURI = (value: string): string | null => {
    if (!value) return null; // Optional field
    if (!/^https?:\/\/.+/.test(value)) {
      return "Must be a valid URL starting with http:// or https://";
    }
    return null;
  };

  const validateEmail = (value: string): string | null => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "Invalid email format";
    }
    return null;
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate URI fields
    const uriFields = ["logo_uri", "policy_uri", "information_uri", "organization_uri"] as const;
    uriFields.forEach((field) => {
      const value = formData[field];
      if (value) {
        const error = validateURI(value);
        if (error) errors[field] = error;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaveError(null);

      // Merge with existing metadata to preserve other entity types
      const updatedMetadata: Schemas.Metadata = {
        ...currentMetadata, // Preserve openid_provider, openid_relying_party, etc.
        federation_entity: {
          ...formData,
          // Remove empty strings
          ...(formData.organization_name && { organization_name: formData.organization_name }),
          ...(formData.display_name && { display_name: formData.display_name }),
          ...(formData.description && { description: formData.description }),
          ...(formData.keywords && formData.keywords.length > 0 && { keywords: formData.keywords }),
          ...(formData.contacts && formData.contacts.length > 0 && { contacts: formData.contacts }),
          ...(formData.logo_uri && { logo_uri: formData.logo_uri }),
          ...(formData.policy_uri && { policy_uri: formData.policy_uri }),
          ...(formData.information_uri && { information_uri: formData.information_uri }),
          ...(formData.organization_uri && { organization_uri: formData.organization_uri }),
        },
      };

      await updateMutation.mutateAsync({
        body: updatedMetadata,
      });

      queryClient.invalidateQueries({ queryKey: ["getEntityConfigurationMetadata"] });
      queryClient.invalidateQueries({ queryKey: ["getEntityConfiguration"] });
      
      navigate("/admin/trust-anchors/configure?tab=metadata");
    } catch (error: any) {
      setSaveError(error?.message || "Failed to save metadata. Please try again.");
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
        <PageHeader
          title="Edit Federation Entity Metadata"
          description="Configure organization information and entity details"
        />

        {saveError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Organization Information</CardTitle>
            <CardDescription>
              Basic information about the organization operating this Trust Anchor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organization_name">Organization Name</Label>
              <Input
                id="organization_name"
                value={formData.organization_name}
                onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                placeholder="e.g., ACME Federation Authority"
              />
              <p className="text-sm text-muted-foreground">
                Human-readable name of the organization owning this entity
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="e.g., ACME Trust Anchor"
              />
              <p className="text-sm text-muted-foreground">
                Human-readable name of this entity to be presented to users
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this Trust Anchor and its purpose..."
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                Brief description presentable to end users
              </p>
            </div>

            <MultiValueInput
              label="Contacts"
              values={formData.contacts || []}
              onChange={(contacts) => setFormData({ ...formData, contacts })}
              placeholder="admin@example.com or Contact Name"
              validator={validateEmail}
              helperText="Email addresses or names of contact persons (press Enter to add)"
            />

            <MultiValueInput
              label="Keywords"
              values={formData.keywords || []}
              onChange={(keywords) => setFormData({ ...formData, keywords })}
              placeholder="e.g., federation, research, education"
              helperText="Search keywords, tags, categories, or labels (press Enter to add)"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>URIs & Links</CardTitle>
            <CardDescription>
              URLs for logos, policies, and additional information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo_uri">Logo URI</Label>
              <Input
                id="logo_uri"
                type="url"
                value={formData.logo_uri}
                onChange={(e) => setFormData({ ...formData, logo_uri: e.target.value })}
                placeholder="https://example.com/logo.png"
                className={validationErrors.logo_uri ? "border-destructive" : ""}
              />
              {validationErrors.logo_uri && (
                <p className="text-sm text-destructive">{validationErrors.logo_uri}</p>
              )}
              <p className="text-sm text-muted-foreground">
                URL pointing to the organization's logo
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="policy_uri">Policy URI</Label>
              <Input
                id="policy_uri"
                type="url"
                value={formData.policy_uri}
                onChange={(e) => setFormData({ ...formData, policy_uri: e.target.value })}
                placeholder="https://example.com/policies"
                className={validationErrors.policy_uri ? "border-destructive" : ""}
              />
              {validationErrors.policy_uri && (
                <p className="text-sm text-destructive">{validationErrors.policy_uri}</p>
              )}
              <p className="text-sm text-muted-foreground">
                URL for documentation of conditions and policies
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="information_uri">Information URI</Label>
              <Input
                id="information_uri"
                type="url"
                value={formData.information_uri}
                onChange={(e) => setFormData({ ...formData, information_uri: e.target.value })}
                placeholder="https://example.com/info"
                className={validationErrors.information_uri ? "border-destructive" : ""}
              />
              {validationErrors.information_uri && (
                <p className="text-sm text-destructive">{validationErrors.information_uri}</p>
              )}
              <p className="text-sm text-muted-foreground">
                URL for additional information viewable by end users
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization_uri">Organization URI</Label>
              <Input
                id="organization_uri"
                type="url"
                value={formData.organization_uri}
                onChange={(e) => setFormData({ ...formData, organization_uri: e.target.value })}
                placeholder="https://example.com"
                className={validationErrors.organization_uri ? "border-destructive" : ""}
              />
              {validationErrors.organization_uri && (
                <p className="text-sm text-destructive">{validationErrors.organization_uri}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Home page URL of the organization
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Metadata
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/admin/trust-anchors/configure?tab=metadata")}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </div>
    </RequireRole>
  );
}
