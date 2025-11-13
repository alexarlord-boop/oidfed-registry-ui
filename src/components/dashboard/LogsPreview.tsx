import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetLogs } from "@/api/apiComponents";

export const LogsPreview: React.FC<{ limit?: number }> = ({ limit = 6 }) => {
  const { data, isLoading, error } = useGetLogs({ queryParams: { limit } });
  const logs = (data as any) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Logs</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <div>Loading logs…</div>}
        {error && <div className="text-destructive">Error loading logs</div>}
        {!isLoading && !error && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Showing {logs.length} entries</div>
            <div className="divide-y rounded border overflow-hidden font-mono text-sm max-h-48 overflow-auto">
              {logs.length === 0 && <div className="p-2 text-sm">No logs</div>}
              {logs.map((l: any) => (
                <div key={String(l.id)} className="p-2">
                  <div className="text-xs text-muted-foreground">{l.timestamp ? new Date(l.timestamp).toLocaleString() : ''}</div>
                  <div className="flex items-center gap-2">
                    <div className="font-medium">[{l.severity}]</div>
                    <div className="truncate">{l.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LogsPreview;
