import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartPieSimple } from "@/components/chart-pie-simple"
import { ChartLineStep } from "@/components/chart-line-step"
import { Button } from "@/components/ui/button";

import { 
  useStatus, 
  useListAccounts, 
  useListTrustMarkTypes,
  useGetLogs 
 } from "@/api/apiComponents"

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  lastUpdated: string;
}

export const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);

  // TESTING
  const status = useStatus({})
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const testStatus = async () => {
    setLoading(true)
    try {
      const result = await apiFetch({
        url: '/status',
        method: 'get'
      })
      setData(result)
    } catch (error) {
      console.error('Error:', error)
      setData({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Direct API Test</h2>
      <button 
        onClick={testStatus} 
        disabled={loading}
        style={{ padding: '10px 20px', fontSize: '16px' }}
      >
        {loading ? 'Testing...' : 'Test Status Endpoint'}
      </button>
      
      {data && (
        <div style={{ marginTop: '20px' }}>
          <h3>Response:</h3>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '15px', 
            borderRadius: '5px',
            overflow: 'auto'
          }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
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
