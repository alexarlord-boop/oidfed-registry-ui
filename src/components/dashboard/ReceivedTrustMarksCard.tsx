import React from "react";
import { useListReceivedTrustMarks } from "@/api/apiComponents";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const ReceivedTrustMarksCard: React.FC = () => {
  const { data, isLoading, error } = useListReceivedTrustMarks({});
  const items = (data as any)?.receivedTrustMarks ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Received Trust Marks</CardTitle>
        <CardDescription>GET /received-trust-marks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-lg font-medium">{isLoading ? "…" : items.length}</div>
        </div>
        {error && <div className="text-sm text-destructive mt-2">Error fetching</div>}
        {items.length > 0 && (
          <ul className="mt-2 text-sm list-disc list-inside max-h-36 overflow-auto">
            {items.slice(0, 6).map((r: any) => (
              <li key={r.id}>{r.trust_mark_id ?? r.id} {r.createdAt ? `(${new Date(r.createdAt).toLocaleString()})` : null}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default ReceivedTrustMarksCard;
