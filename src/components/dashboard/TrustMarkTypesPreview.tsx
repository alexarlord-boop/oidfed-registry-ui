import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetTrustMarkTypes } from "@/api/client";

export const TrustMarkTypesPreview: React.FC = () => {
  const { data, isLoading, error } = useGetTrustMarkTypes({});
  const types = Array.isArray(data) ? data : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trust Mark Types</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <div>Loading trust mark types…</div>}
        {error && <div className="text-destructive">Error loading types</div>}
        {!isLoading && !error && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Total types: {types.length}</div>
            <div className="divide-y rounded border overflow-hidden">
              {types.length === 0 && <div className="p-2 text-sm">No types</div>}
              {types.slice(0, 8).map((t: any) => (
                <div key={t.id} className="flex items-center justify-between p-2">
                  <div>
                    <div className="font-medium">{t.trust_mark_type ?? t.id}</div>
                    <div className="text-xs text-muted-foreground">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : ''}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{t.id?.slice(0, 8)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrustMarkTypesPreview;
