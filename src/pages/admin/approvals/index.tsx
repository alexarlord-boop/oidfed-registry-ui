import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle, XCircle, Clock, Users, Globe, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { authService, type User } from "@/api/authService";
import { Alert, AlertDescription } from "@/components/ui/alert";


export function AdminApprovals() {
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Action states
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [userToApprove, setUserToApprove] = useState<User | null>(null);
  const [userToReject, setUserToReject] = useState<User | null>(null);

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      const data = await authService.admin.listPendingUsers();
      setPendingUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load pending users');
      console.error('Failed to load pending users:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadPendingUsers(true);
  };

  const handleApproveUser = async () => {
    if (!userToApprove) return;
    
    try {
      setActionInProgress(userToApprove.id);
      setError(null);
      
      await authService.admin.approveUser(userToApprove.id);
      
      setSuccessMessage(`User ${userToApprove.username} approved successfully`);
      setPendingUsers(prev => prev.filter(u => u.id !== userToApprove.id));
      setUserToApprove(null);
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to approve user');
      console.error('Failed to approve user:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRejectUser = async () => {
    if (!userToReject) return;
    
    try {
      setActionInProgress(userToReject.id);
      setError(null);
      
      await authService.admin.rejectUser(userToReject.id);
      
      setSuccessMessage(`User ${userToReject.username} rejected`);
      setPendingUsers(prev => prev.filter(u => u.id !== userToReject.id));
      setUserToReject(null);
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reject user');
      console.error('Failed to reject user:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="fixed top-4 right-4 w-auto max-w-md z-50 shadow-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {successMessage && (
        <Alert className="fixed top-4 right-4 w-auto max-w-md z-50 shadow-lg bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Approval Queue</h1>
          <p className="text-muted-foreground">
            Review and approve pending user registrations
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              Requiring action
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending User Registrations</CardTitle>
          <CardDescription>
            Review and approve user account requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pendingUsers.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.username}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.organization || "—"}</TableCell>
                      <TableCell>
                        {user.created_at 
                          ? new Date(user.created_at).toLocaleDateString()
                          : "—"
                        }
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/users/${user.id}`)}
                          disabled={!!actionInProgress}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUserToReject(user)}
                          disabled={!!actionInProgress}
                        >
                          {actionInProgress === user.id ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <XCircle className="mr-1 h-3 w-3" />
                          )}
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setUserToApprove(user)}
                          disabled={!!actionInProgress}
                        >
                          {actionInProgress === user.id ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle className="mr-1 h-3 w-3" />
                          )}
                          Approve
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No pending user registrations
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve User Dialog */}
      <AlertDialog open={!!userToApprove} onOpenChange={(open) => !open && setUserToApprove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve User</AlertDialogTitle>
            <AlertDialogDescription>
              {userToApprove && (
                <>
                  This will approve the user account for <strong>{userToApprove.username}</strong> and grant them
                  access to the system.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!actionInProgress}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApproveUser} disabled={!!actionInProgress}>
              {actionInProgress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                'Approve User'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject User Dialog */}
      <AlertDialog open={!!userToReject} onOpenChange={(open) => !open && setUserToReject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject User</AlertDialogTitle>
            <AlertDialogDescription>
              {userToReject && (
                <>
                  This will reject and delete the user account for <strong>{userToReject.username}</strong>.
                  This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!actionInProgress}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectUser}
              disabled={!!actionInProgress}
              className="bg-destructive hover:bg-destructive/90"
            >
              {actionInProgress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Reject User'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default AdminApprovals;
