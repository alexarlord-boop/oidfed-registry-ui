import React from "react";
import { useGetEntityMetadata } from "@/api/apiComponents";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const MetadataCard: React.FC = () => {
  const { data, isLoading, error } = useGetEntityMetadata({});
  const items = (data as any)?.metadata ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Metadata</CardTitle>
        <CardDescription>GET /metadata</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-lg font-medium">{isLoading ? "…" : (Array.isArray(items) ? items.length : "—")}</div>
        </div>
        {error && <div className="text-sm text-destructive mt-2">Error fetching</div>}
        {items && Array.isArray(items) && items.length > 0 && (
          <div className="mt-2">
            <div className="h-40 overflow-auto bg-slate-50 dark:bg-slate-800 p-2 rounded text-xs font-mono text-slate-900 dark:text-slate-100">
              <pre className="whitespace-pre-wrap">{JSON.stringify(items, null, 2)}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MetadataCard;
