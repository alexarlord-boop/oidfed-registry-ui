import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useListSubordinates } from "@/api/client";

export const AccountsPreview: React.FC = () => {
  const { data, isLoading, error } = useListSubordinates({});
  const accounts = Array.isArray(data) ? data : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subordinates</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <div>Loading accounts…</div>}
        {error && <div className="text-destructive">Error loading accounts</div>}
        {!isLoading && !error && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Total subordinates: {accounts.length}</div>
            <div className="divide-y rounded border overflow-hidden">
              {accounts.length === 0 && <div className="p-2 text-sm">No subordinates</div>}
              {accounts.slice(0, 8).map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-2">
                  <div>
                    <div className="font-medium">{a.entity_id ?? a.id}</div>
                    <div className="text-xs text-muted-foreground">{a.status} - {a.registered_entity_types?.join(', ')}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{a.id?.slice(0, 8)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AccountsPreview;
