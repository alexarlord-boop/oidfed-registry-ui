import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useListTrustMarkTypes } from "@/api/apiComponents";

export const TrustMarkTypesPreview: React.FC = () => {
  const { data, isLoading, error } = useListTrustMarkTypes({});
  const types = (data as any)?.trustMarkTypes ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trust Mark Types</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <div>Loading trust mark types…</div>}
        {error && <div className="text-destructive">Error loading types</div>}
        {!isLoading && !error && (
          <div className="text-sm">
            {types.length === 0 ? (
              <div>No types</div>
            ) : (
              <ul className="list-disc pl-5 max-h-40 overflow-auto">
                {types.slice(0, 8).map((t: any) => (
                  <li key={t.id}>{t.name ?? t.identifier ?? t.id}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrustMarkTypesPreview;
