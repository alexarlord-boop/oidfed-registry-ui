import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Save, X, Info, ExternalLink } from "lucide-react";
import { useCreateEntityConfigurationTrustMark } from "../../../../../../generated/api/apiComponents";
import { RequireRole } from "@/components/auth/RequireRole";
import { UserRole } from "@/types/auth";
import { PageHeader } from "@/components/page-header";
import { useQueryClient } from "@tanstack/react-query";

export function AddTrustMark() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createMutation = useCreateEntityConfigurationTrustMark();

  const [formData, setFormData] = useState({
    trust_mark_type: "",
    trust_mark_issuer: "",
    trust_mark: "",
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const validateURI = (value: string, fieldName: string): string | null => {
    if (!value.trim()) {
      return `${fieldName} is required`;
    }
    if (!/^https?:\/\/.+/.test(value)) {
      return "Must be a valid URL starting with http:// or https://";
    }
    return null;
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    const typeError = validateURI(formData.trust_mark_type, "Trust Mark Type");
    if (typeError) errors.trust_mark_type = typeError;

    const issuerError = validateURI(formData.trust_mark_issuer, "Trust Mark Issuer");
    if (issuerError) errors.trust_mark_issuer = issuerError;

    if (!formData.trust_mark.trim()) {
      errors.trust_mark = "Trust Mark JWT is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAttach = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaveError(null);

      await createMutation.mutateAsync({
        body: {
          trust_mark_type: formData.trust_mark_type.trim(),
          trust_mark_issuer: formData.trust_mark_issuer.trim(),
          trust_mark: formData.trust_mark.trim(),
        },
      });

      queryClient.invalidateQueries({ queryKey: ["listEntityConfigurationTrustMarks"] });
      navigate("/admin/trust-anchors/configure?tab=trust-marks");
    } catch (error: any) {
      setSaveError(error?.message || "Failed to attach trust mark. Please try again.");
    }
  };

  return (
    <RequireRole role={UserRole.ADMIN}>
      <div className="space-y-6">
        <PageHeader
          title="Attach Trust Mark"
          description="Add a trust mark to this Trust Anchor's entity configuration"
        />

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Trust marks provide additional attestations about this entity. You'll need to manually
            enter the trust mark type, issuer, and JWT.{" "}
            <a
              href="/admin/trust-marks"
              className="underline inline-flex items-center gap-1 hover:text-primary"
            >
              Browse Trust Mark Registry
              <ExternalLink className="h-3 w-3" />
            </a>
          </AlertDescription>
        </Alert>

        {saveError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Trust Mark Details</CardTitle>
            <CardDescription>
              Enter the trust mark type identifier, issuer, and JWT token
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="trust_mark_type">Trust Mark Type *</Label>
              <Input
                id="trust_mark_type"
                type="url"
                value={formData.trust_mark_type}
                onChange={(e) => {
                  setFormData({ ...formData, trust_mark_type: e.target.value });
                  setValidationErrors({ ...validationErrors, trust_mark_type: "" });
                }}
                placeholder="https://example.org/trust-marks/type1"
                className={validationErrors.trust_mark_type ? "border-destructive" : ""}
              />
              {validationErrors.trust_mark_type && (
                <p className="text-sm text-destructive">{validationErrors.trust_mark_type}</p>
              )}
              <p className="text-sm text-muted-foreground">
                The trust mark type identifier (URI format)
              </p>
              <p className="text-xs text-muted-foreground italic">
                Example: https://refeds.org/assurance or
                https://www.geant.org/uri/dataprotection-code-of-conduct/v1
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trust_mark_issuer">Trust Mark Issuer *</Label>
              <Input
                id="trust_mark_issuer"
                type="url"
                value={formData.trust_mark_issuer}
                onChange={(e) => {
                  setFormData({ ...formData, trust_mark_issuer: e.target.value });
                  setValidationErrors({ ...validationErrors, trust_mark_issuer: "" });
                }}
                placeholder="https://issuer.example.org"
                className={validationErrors.trust_mark_issuer ? "border-destructive" : ""}
              />
              {validationErrors.trust_mark_issuer && (
                <p className="text-sm text-destructive">{validationErrors.trust_mark_issuer}</p>
              )}
              <p className="text-sm text-muted-foreground">
                The entity ID of the trust mark issuer (URI format)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trust_mark">Trust Mark JWT *</Label>
              <Textarea
                id="trust_mark"
                value={formData.trust_mark}
                onChange={(e) => {
                  setFormData({ ...formData, trust_mark: e.target.value });
                  setValidationErrors({ ...validationErrors, trust_mark: "" });
                }}
                placeholder="eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1Njc4OTAifQ.eyJpc3MiOiJodHRwczovL2lzc3Vlci5leGFtcGxlLm9yZyIsInN1YiI6Imh0dHBzOi8vZW50aXR5LmV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDI2MjJ9..."
                rows={8}
                className={`font-mono text-xs ${validationErrors.trust_mark ? "border-destructive" : ""}`}
              />
              {validationErrors.trust_mark && (
                <p className="text-sm text-destructive">{validationErrors.trust_mark}</p>
              )}
              <p className="text-sm text-muted-foreground">
                The complete JWT token for this trust mark (base64-encoded, typically starts with
                "eyJ...")
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button onClick={handleAttach} disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Attaching...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Attach Trust Mark
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/admin/trust-anchors/configure?tab=trust-marks")}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </div>
    </RequireRole>
  );
}
