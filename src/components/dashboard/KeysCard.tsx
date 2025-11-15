import React from "react";
import { useListKeys } from "@/api/apiComponents";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const KeysCard: React.FC = () => {
  const { data, isLoading, error } = useListKeys({});
  const jwks = (data as any)?.jwks ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Keys</CardTitle>
        <CardDescription>GET /keys</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-lg font-medium">{isLoading ? "…" : jwks.length}</div>
        </div>
        {error && <div className="text-sm text-destructive mt-2">Error fetching</div>}
        {jwks.length > 0 && (
          <div className="mt-2">
            <div className="h-40 overflow-auto bg-slate-50 dark:bg-slate-800 p-2 rounded text-xs font-mono text-slate-900 dark:text-slate-100">
              <pre className="whitespace-pre-wrap">{JSON.stringify(jwks, null, 2)}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KeysCard;
