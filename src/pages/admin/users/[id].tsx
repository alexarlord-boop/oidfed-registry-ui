import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ArrowLeft, Save, Trash2, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { authService, type User, type UserUpdate, UserRole } from "@/api/authService";
import { Alert, AlertDescription } from "@/components/ui/alert";


export function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<UserUpdate>({});
  
  // Dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    if (id) {
      loadUser();
    }
  }, [id]);

  const loadUser = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const userData = await authService.admin.getUser(id);
      setUser(userData);
      setFormData({
        email: userData.email,
        full_name: userData.full_name,
        organization: userData.organization,
        role: userData.role,
        is_active: userData.is_active,
        is_approved: userData.is_approved,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load user');
      console.error('Failed to load user:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id || !user) return;
    
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      const updatedUser = await authService.admin.updateUser(id, formData);
      setUser(updatedUser);
      setIsEditing(false);
      setSuccessMessage('User updated successfully');
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
      console.error('Failed to update user:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    
    try {
      setIsSaving(true);
      setError(null);
      const updatedUser = await authService.admin.approveUser(id);
      setUser(updatedUser);
      setFormData(prev => ({ ...prev, is_approved: true }));
      setSuccessMessage('User approved successfully');
      setShowApproveDialog(false);
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to approve user');
      console.error('Failed to approve user:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReject = async () => {
    if (!id) return;
    
    try {
      setIsSaving(true);
      setError(null);
      await authService.admin.rejectUser(id);
      setSuccessMessage('User rejected');
      setShowRejectDialog(false);
      
      setTimeout(() => {
        navigate('/admin/users');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to reject user');
      console.error('Failed to reject user:', err);
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      setIsSaving(true);
      setError(null);
      await authService.admin.deleteUser(id);
      setSuccessMessage('User deleted');
      setShowDeleteDialog(false);
      
      setTimeout(() => {
        navigate('/admin/users');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
      console.error('Failed to delete user:', err);
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        email: user.email,
        full_name: user.full_name,
        organization: user.organization,
        role: user.role,
        is_active: user.is_active,
        is_approved: user.is_approved,
      });
    }
    setIsEditing(false);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>User not found</AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/admin/users')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
      </div>
    );
  }

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
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/users")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
            <p className="text-muted-foreground">
              View and manage user account information
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!user.is_approved && (
            <>
              <Button 
                variant="outline" 
                onClick={() => setShowRejectDialog(true)}
                disabled={isSaving}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button 
                onClick={() => setShowApproveDialog(true)}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Approve
              </Button>
            </>
          )}
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit</Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              User profile and authentication details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={user.username}
                  disabled
                  className="disabled:opacity-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  disabled={!isEditing}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name || ""}
                  disabled={!isEditing}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Input
                  id="organization"
                  value={formData.organization || ""}
                  disabled={!isEditing}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                />
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                  disabled={!isEditing}
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                    <SelectItem value={UserRole.TECHNICAL_CONTACT}>Technical Contact</SelectItem>
                    <SelectItem value={UserRole.PENDING}>Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex gap-2 pt-2">
                  {formData.is_approved ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Approved
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      Pending Approval
                    </Badge>
                  )}
                  {formData.is_active ? (
                    <Badge variant="outline">Active</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      Inactive
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {isEditing && (
              <>
                <Separator />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="is_active" className="cursor-pointer">
                      Account Active
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_approved"
                      checked={formData.is_approved}
                      onChange={(e) => setFormData({ ...formData, is_approved: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="is_approved" className="cursor-pointer">
                      Manually Approve
                    </Label>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Created</Label>
                <p className="text-sm font-medium">
                  {new Date(user.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              {user.last_login && (
                <div>
                  <Label className="text-muted-foreground">Last Login</Label>
                  <p className="text-sm font-medium">
                    {new Date(user.last_login).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isSaving}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete User
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user account for <strong>{user.username}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSaving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete User'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve User</AlertDialogTitle>
            <AlertDialogDescription>
              This will approve the user account for <strong>{user.username}</strong> and grant them
              access to the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={isSaving}>
              {isSaving ? (
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

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject User</AlertDialogTitle>
            <AlertDialogDescription>
              This will reject and delete the user account for <strong>{user.username}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={isSaving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSaving ? (
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

export default AdminUserDetail;
