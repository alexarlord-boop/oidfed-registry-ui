import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/UserAvatar";
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
import { ArrowLeft, Save, Trash2, CheckCircle, XCircle, Loader2, AlertCircle, ExternalLink } from "lucide-react";
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
      
      const roleChanged = formData.role !== user.role;
      
      const updatedUser = await authService.admin.updateUser(id, formData);
      setUser(updatedUser);
      setIsEditing(false);
      
      // Show appropriate message based on what changed
      if (roleChanged) {
        setSuccessMessage('User updated successfully. Note: User must log out and log back in for role changes to take effect.');
      } else {
        setSuccessMessage('User updated successfully');
      }
      
      setTimeout(() => setSuccessMessage(null), 5000);
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
      setSuccessMessage('User approved successfully. The user can now log in.');
      setShowApproveDialog(false);
      
      setTimeout(() => setSuccessMessage(null), 5000);
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
          <AlertDescription className="text-green-800 whitespace-pre-wrap">{successMessage}</AlertDescription>
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
          <UserAvatar
            name={user.username}
            src={user.oidc_provider === 'github' ? `https://github.com/${user.username}.png` : null}
            size="xl"
          />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{user.username}</h1>
            <p className="text-muted-foreground">
              {user.email}
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
              {user.created_at && (
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
              )}
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
              {user.oidc_provider && (
                <div>
                  <Label className="text-muted-foreground">SSO Provider</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {user.oidc_provider === 'github' && (
                      <a
                        href={`https://github.com/${user.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        <span>GitHub</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {user.oidc_provider === 'keycloak' && (
                      <div className="inline-flex items-center gap-2 text-sm font-medium">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11.516 0L.894 5.727v12.545l10.622 5.727 10.622-5.727V5.727L11.516 0zm6.93 15.08l-2.033 3.52-3.533-2.04v4.07l-2.796-1.51v-4.07l-3.533 2.04-2.033-3.52 3.533-2.04-3.533-2.04 2.033-3.52 3.533 2.04v-4.07l2.796 1.51v4.07l3.533-2.04 2.033 3.52-3.533 2.04 3.533 2.04z"/>
                        </svg>
                        <span>Keycloak</span>
                      </div>
                    )}
                    {!['github', 'keycloak'].includes(user.oidc_provider) && (
                      <Badge variant="outline" className="capitalize">
                        {user.oidc_provider}
                      </Badge>
                    )}
                  </div>
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
              className="bg-destructive hover:bg-destructive/90"
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
            <AlertDialogDescription className="space-y-2">
              <p>
                This will approve the user account for <strong>{user.username}</strong> and grant them
                access to the system with the role: <strong>{user.role}</strong>.
              </p>
              <Alert className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  If this user is already logged in, they will need to log out and log back in to access the system with their new permissions.
                </AlertDescription>
              </Alert>
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
              className="bg-destructive hover:bg-destructive/90"
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
