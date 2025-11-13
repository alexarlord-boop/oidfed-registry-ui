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
          <div className="text-xs font-mono max-h-48 overflow-auto">
            {logs.length === 0 && <div className="text-sm">No logs</div>}
            {logs.map((l: any) => (
              <div key={l.id} className="pb-1 border-b border-dashed border-slate-100">
                <div className="text-xs text-muted-foreground">{new Date(l.timestamp).toLocaleString()}</div>
                <div className="text-sm">[{l.severity}] {l.message}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LogsPreview;
