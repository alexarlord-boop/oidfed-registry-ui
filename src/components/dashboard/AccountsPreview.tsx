import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useListAccounts } from "@/api/apiComponents";

export const AccountsPreview: React.FC = () => {
  const { data, isLoading, error } = useListAccounts({});
  const accounts = (data as any)?.accounts ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accounts</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <div>Loading accounts…</div>}
        {error && <div className="text-destructive">Error loading accounts</div>}
        {!isLoading && !error && (
          <ul className="list-disc pl-5 max-h-40 overflow-auto text-sm">
            {accounts.length === 0 && <li>No accounts</li>}
            {accounts.slice(0, 8).map((a: any) => (
              <li key={a.id}>{a.username ?? a.identifier ?? a.id}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default AccountsPreview;
