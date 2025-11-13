import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ChartLogsPie from "@/components/dashboard/ChartLogsPie";
import ChartLogsLine from "@/components/dashboard/ChartLogsLine";
import KeysCard from "@/components/dashboard/KeysCard";
import MetadataCard from "@/components/dashboard/MetadataCard";
import ReceivedTrustMarksCard from "@/components/dashboard/ReceivedTrustMarksCard";
import { Button } from "@/components/ui/button";

import { useStatus } from "@/api/apiComponents"
import AccountsPreview from "@/components/dashboard/AccountsPreview";
import TrustMarkTypesPreview from "@/components/dashboard/TrustMarkTypesPreview";
import LogsPreview from "@/components/dashboard/LogsPreview";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  lastUpdated: string;
}

export const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);

  // TESTING - use the generated hook
  const status = useStatus({})
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  // dev auth handled by `DevLogin` component (stores values in localStorage)

  const testStatus = async () => {
    setLoading(true)
    try {
      const result = await status.refetch()
      setData(result.data ?? result)
    } catch (error: any) {
      console.error("Error:", error)
      setData({ error: error?.message ?? String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Overview Status</CardTitle>
            <CardDescription>Admin node status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-lg font-medium">{status.data?.status ?? 'Unknown'}</div>
              <Button onClick={testStatus} disabled={loading}>{loading ? 'Testing…' : 'Refresh'}</Button>
            </div>
            {data && (
              <pre className="mt-3 text-xs bg-slate-50 p-2 rounded max-h-40 overflow-auto">{JSON.stringify(data, null, 2)}</pre>
            )}
          </CardContent>
        </Card>

        <AccountsPreview />
       
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       
        <KeysCard />
        <MetadataCard />
       
      </div>


      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
       
       
        <TrustMarkTypesPreview />
      </div>


      
    </div>
  )

  // useEffect(() => {
  //   const fetchStats = async () => {
  //     try {
  //       const response = await fetch("/api/dashboard/stats");
  //       if (!response.ok) {
  //         throw new Error("Failed to fetch dashboard stats");
  //       }
  //       const data = await response.json();
  //       setStats(data.data);
  //     } catch (err) {
  //       setError(err instanceof Error ? err.message : "An error occurred");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchStats();
  // }, []);

  // return (
  //   <div className="w-full">
      

  //     {loading && (
  //       <div className="text-center py-8">
  //         <p className="text-muted-foreground">Loading...</p>
  //       </div>
  //     )}

  //     {error && (
  //       <Card className="border-destructive">
  //         <CardContent className="pt-6">
  //           <p className="text-destructive">Error: {error}</p>
  //         </CardContent>
  //       </Card>
  //     )}

  //     <div className="pb-4">
  //     <Card>
  //           <CardHeader>
  //             <CardTitle>Overview Status</CardTitle>
  //             <CardDescription>Some valuable info</CardDescription>
  //           </CardHeader>
  //           <CardContent>
  //             <div className="text-4xl font-bold"></div>
  //             <Button className="flex ml-auto">Test</Button>
  //           </CardContent>
  //         </Card>
  //     </div>


  //     {stats && (
  //       <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-4">
  //         <Card>
  //           <CardHeader>
  //             <CardTitle>Total</CardTitle>
  //             <CardDescription>Some valuable info</CardDescription>
  //           </CardHeader>
  //           <CardContent>
  //             <div className="text-4xl font-bold text-primary">{stats.totalUsers.toLocaleString()}</div>
  //           </CardContent>
  //         </Card>

  //         <Card>
  //           <CardHeader>
  //             <CardTitle>Active</CardTitle>
  //             <CardDescription>Some valuable info</CardDescription>
  //           </CardHeader>
  //           <CardContent>
  //             <div className="text-4xl font-bold text-primary">{stats.totalUsers.toLocaleString()}</div>
  //           </CardContent>
  //         </Card>

  //         <Card>
  //           <CardHeader>
  //             <CardTitle>Expiring</CardTitle>
  //             <CardDescription>Some valuable info</CardDescription>
  //           </CardHeader>
  //           <CardContent>
  //             <div className="text-4xl font-bold text-primary">
  //               {stats.activeUsers.toLocaleString()}
  //             </div>
  //           </CardContent>
  //         </Card>

  //         <Card>
  //           <CardHeader>
  //             <CardTitle>Trust Marks</CardTitle>
  //             <CardDescription>Some valuable info</CardDescription>
  //           </CardHeader>
  //           <CardContent>
  //             <div className="text-sm text-muted-foreground">
  //               {new Date(stats.lastUpdated).toLocaleString()}
  //             </div>
  //           </CardContent>
  //         </Card>
  //       </div>
  //     )}

  //     <div className=" grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4">
  //       <Card>
  //             <CardHeader>
  //               <CardTitle>Charts</CardTitle>
  //               <CardDescription>Some valuable info</CardDescription>
  //             </CardHeader>
  //             <CardContent>
  //               <ChartPieSimple/>
  //             </CardContent>
  //       </Card>

  //       <Card>
  //         <CardHeader>
  //           <CardTitle>Recent Activity</CardTitle>
  //           <CardDescription>Some valuable info</CardDescription>
  //         </CardHeader>
  //         <CardContent>
  //         <ChartLineStep/>
  //         </CardContent>
  //       </Card>

  //     </div>

      

  //     <div className="pt-4">
  //     <Card>
  //           <CardHeader>
  //             <CardTitle>Entity Highlights</CardTitle>
  //             <CardDescription>Some valuable info</CardDescription>
  //           </CardHeader>
  //           <CardContent>
             
  //           </CardContent>
  //         </Card>
  //     </div>

      
  //   </div>

    
  // );
};
