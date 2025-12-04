import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCreateSubordinate } from "../../../../generated/api/apiComponents";
import { ENTITY_TYPES, ENTITY_TYPE_LABELS, ENTITY_STATUS } from "@/types/constants";
import { RequireRole } from "@/components/auth/RequireRole";
import { UserRole } from "@/types/auth";
import type { Schemas } from "../../../../generated/api/apiSchemas";

export function AdminEntityNew() {
  const navigate = useNavigate();
  const createMutation = useCreateSubordinate();
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    entity_id: "",
    description: "",
    registered_entity_types: [] as string[],
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const entityTypeOptions = [
    { value: ENTITY_TYPES.TRUST_ANCHOR, label: ENTITY_TYPE_LABELS[ENTITY_TYPES.TRUST_ANCHOR] },
    { value: ENTITY_TYPES.INTERMEDIATE_AUTHORITY, label: ENTITY_TYPE_LABELS[ENTITY_TYPES.INTERMEDIATE_AUTHORITY] },
    { value: ENTITY_TYPES.TEST_FEDERATION, label: ENTITY_TYPE_LABELS[ENTITY_TYPES.TEST_FEDERATION] },
    { value: ENTITY_TYPES.TRAINING_FEDERATION, label: ENTITY_TYPE_LABELS[ENTITY_TYPES.TRAINING_FEDERATION] },
    { value: ENTITY_TYPES.OPENID_PROVIDER, label: ENTITY_TYPE_LABELS[ENTITY_TYPES.OPENID_PROVIDER] },
    { value: ENTITY_TYPES.OPENID_RELYING_PARTY, label: ENTITY_TYPE_LABELS[ENTITY_TYPES.OPENID_RELYING_PARTY] },
    { value: ENTITY_TYPES.FEDERATION_ENTITY, label: ENTITY_TYPE_LABELS[ENTITY_TYPES.FEDERATION_ENTITY] },
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
      
      const payload: Schemas.AddSubordinate = {
        entity_id: formData.entity_id.trim(),
        registered_entity_types: formData.registered_entity_types,
      };

      const newEntity = await createMutation.mutateAsync({
        body: payload,
      });
      
      navigate(`/admin/entities`);
    } catch (err: any) {
      setError(err.message || 'Failed to register entity');
      console.error('Failed to register entity:', err);
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
    <RequireRole roles={[UserRole.ADMIN, UserRole.TECHNICAL_CONTACT]}>
      <div className="space-y-6">
        {error && (
          <Alert variant="destructive" className="fixed top-4 right-4 w-auto max-w-md z-50 shadow-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/entities")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Register Entity</h1>
            <p className="text-muted-foreground">
              Register a new entity in the federation
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Entity Information</CardTitle>
              <CardDescription>
                Enter the details for the new entity. All registrations require approval.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="entity_id">
                  Entity ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="entity_id"
                  value={formData.entity_id}
                  onChange={(e) => setFormData({ ...formData, entity_id: e.target.value })}
                  placeholder="https://entity.example.com"
                  className={validationErrors.entity_id ? "border-destructive" : ""}
                />
                <p className="text-sm text-muted-foreground">
                  The unique identifier URL for this entity
                </p>
                {validationErrors.entity_id && (
                  <p className="text-sm text-destructive">{validationErrors.entity_id}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  Entity Types <span className="text-destructive">*</span>
                </Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {entityTypeOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${option.value}`}
                        checked={formData.registered_entity_types.includes(option.value)}
                        onCheckedChange={() => toggleEntityType(option.value)}
                      />
                      <Label
                        htmlFor={`type-${option.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Select all applicable entity types for this entity
                </p>
                {validationErrors.registered_entity_types && (
                  <p className="text-sm text-destructive">{validationErrors.registered_entity_types}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter a description for this entity..."
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">
                  A human-readable description of this entity
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  After registration, this entity will be in <strong>Pending</strong> status and require admin approval before becoming active.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Register Entity
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/entities")}
                  disabled={createMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </RequireRole>
  );
}
