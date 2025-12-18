import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Loader2, AlertCircle, Info, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCreateSubordinate } from "../../../../generated/api/apiComponents";
import * as Schemas from "../../../../generated/api/apiSchemas";
import { ENTITY_TYPES, ENTITY_TYPE_LABELS } from "@/types/constants";
import { useAuth } from "@/hooks/useAuth";

/**
 * Trust Anchor Registration Request Page
 * Allows Technical Contacts to submit requests for new Trust Anchor registration
 * Requests automatically enter "Pending" status and require admin approval
 */
export function RequestTrustAnchor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createMutation = useCreateSubordinate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    entity_id: "",
    description: "",
    registered_entity_types: [] as string[],
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Only TA-related entity types for this form
  const taEntityTypeOptions = [
    { 
      value: ENTITY_TYPES.TRUST_ANCHOR, 
      label: ENTITY_TYPE_LABELS[ENTITY_TYPES.TRUST_ANCHOR],
      description: "Root federation authority"
    },
    { 
      value: ENTITY_TYPES.INTERMEDIATE_AUTHORITY, 
      label: ENTITY_TYPE_LABELS[ENTITY_TYPES.INTERMEDIATE_AUTHORITY],
      description: "For interfederation (e.g., eduGAIN)"
    },
    { 
      value: ENTITY_TYPES.TEST_FEDERATION, 
      label: ENTITY_TYPE_LABELS[ENTITY_TYPES.TEST_FEDERATION],
      description: "Testing environment"
    },
    { 
      value: ENTITY_TYPES.TRAINING_FEDERATION, 
      label: ENTITY_TYPE_LABELS[ENTITY_TYPES.TRAINING_FEDERATION],
      description: "Training and demonstration"
    },
  ];

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.entity_id || formData.entity_id.trim().length === 0) {
      errors.entity_id = "Entity ID is required";
    } else if (!/^https?:\/\/.+/.test(formData.entity_id)) {
      errors.entity_id = "Entity ID must be a valid URL (https://...)";
    }

    if (formData.registered_entity_types.length === 0) {
      errors.registered_entity_types = "At least one entity type must be selected";
    }

    if (!formData.description || formData.description.trim().length === 0) {
      errors.description = "Description is required for approval review";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      
      const payload: Schemas.AddSubordinate = {
        entity_id: formData.entity_id.trim(),
        registered_entity_types: formData.registered_entity_types,
      };

      await createMutation.mutateAsync({
        body: payload,
      });
      
      setSuccess("Trust Anchor registration request submitted successfully!");
      
      // Clear form
      setFormData({
        entity_id: "",
        description: "",
        registered_entity_types: [],
      });

      // Redirect after a short delay
      setTimeout(() => {
        navigate("/admin/entities");
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit registration request');
      console.error('Failed to submit registration request:', err);
    }
  };

  const toggleEntityType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      registered_entity_types: prev.registered_entity_types.includes(type)
        ? prev.registered_entity_types.filter(t => t !== type)
        : [...prev.registered_entity_types, type]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Alert Messages */}
      {error && (
        <Alert variant="destructive" className="fixed top-4 right-4 w-auto max-w-md z-50 shadow-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="fixed top-4 right-4 w-auto max-w-md z-50 shadow-lg border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

     

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Your registration request will be submitted for admin review. You'll be notified once it has been 
          approved or if additional information is needed.
        </AlertDescription>
      </Alert>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Trust Anchor Details</CardTitle>
            <CardDescription>
              Provide information about the Trust Anchor you want to register
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Entity ID */}
            <div className="space-y-2">
              <Label htmlFor="entity_id">
                Entity ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="entity_id"
                value={formData.entity_id}
                onChange={(e) => setFormData({ ...formData, entity_id: e.target.value })}
                placeholder="https://ta.example.com"
                className={validationErrors.entity_id ? "border-destructive" : ""}
              />
              <p className="text-sm text-muted-foreground">
                The unique identifier URL for this Trust Anchor (must start with https://)
              </p>
              {validationErrors.entity_id && (
                <p className="text-sm text-destructive">{validationErrors.entity_id}</p>
              )}
            </div>

            {/* Entity Types */}
            <div className="space-y-3">
              <Label>
                Entity Type <span className="text-destructive">*</span>
              </Label>
              <p className="text-sm text-muted-foreground">
                Select one or more types that describe this Trust Anchor
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {taEntityTypeOptions.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent"
                  >
                    <Checkbox
                      id={option.value}
                      checked={formData.registered_entity_types.includes(option.value)}
                      onCheckedChange={() => toggleEntityType(option.value)}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={option.value}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {option.label}
                      </label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {option.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {validationErrors.registered_entity_types && (
                <p className="text-sm text-destructive">{validationErrors.registered_entity_types}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description / Justification <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Explain the purpose of this Trust Anchor and why it should be registered..."
                rows={5}
                className={validationErrors.description ? "border-destructive" : ""}
              />
              <p className="text-sm text-muted-foreground">
                Provide context for the admin reviewing this request. Include the purpose, expected usage, 
                and any relevant organizational details.
              </p>
              {validationErrors.description && (
                <p className="text-sm text-destructive">{validationErrors.description}</p>
              )}
            </div>

            {/* Submitted By Info */}
            {user && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Submitted by:</strong> {user.username} ({user.email || 'No email'})
                </AlertDescription>
              </Alert>
            )}

            {/* Approval Notice */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Approval Required:</strong> This request will be placed in "Pending" status. 
                An administrator will review your request and either approve or reject it. You can 
                check the status in the Entities list.
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting Request...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Submit Request
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/trust-anchors")}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

export default RequestTrustAnchor;
