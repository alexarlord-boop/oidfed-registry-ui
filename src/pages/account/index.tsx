import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

export const Account = () => {
    const { user } = useAuth();
    
    return (
        <div className="w-full">
           <div className="grid gap-4 grid-cols-2">
           <Card>
                <CardHeader>
                    <CardTitle>Profile information</CardTitle>
                    <CardDescription></CardDescription>
                </CardHeader>
                <CardContent className="flex items-start gap-4">
                    
                    <Avatar className="size-20">
                        {user?.oidc_provider === 'github' ? (
                            <AvatarImage 
                                src={`https://github.com/${user?.username}.png`} 
                                alt={user?.username || 'User'}
                            />
                        ) : null}
                        <AvatarFallback className="text-2xl">
                            {(user?.username || 'U').substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <ul>
                        <li>Contact info for federation communications</li>
                        <li>Organizational affiliation</li>
                        <li>Job title/role for audit trails</li>
                        <li>Department for internal routing</li>
                    </ul>
                  

                   
                </CardContent>
            </Card>


            
            <Card>
                <CardHeader>
                    <CardTitle>Security & Authentication</CardTitle>
                    <CardDescription></CardDescription>
                </CardHeader>
                <CardContent>
                    <ul>
                        <li>Password management</li>
                        <li>Two-factor authentication (MFA)</li>
                        <li>Recovery codes</li>
                        <li>Password history/strength requirements</li>
                    </ul>

                </CardContent>
            </Card>


            <Card>
                <CardHeader>
                    <CardTitle>Notifications & Preferences</CardTitle>
                    <CardDescription></CardDescription>
                </CardHeader>
                <CardContent>
                    <ul>
                        <li></li>
                        <li></li>
                        <li></li>
                        <li></li>
                    </ul>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>API Access & Tokens</CardTitle>
                    <CardDescription></CardDescription>
                </CardHeader>
                <CardContent>
                <ul>
                        <li></li>
                        <li></li>
                        <li></li>
                        <li></li>
                    </ul>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Permissions & Role</CardTitle>
                    <CardDescription></CardDescription>
                </CardHeader>
                <CardContent>
                <ul>
                        <li></li>
                        <li></li>
                        <li></li>
                        <li></li>
                    </ul>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Active sessions</CardTitle>
                    <CardDescription></CardDescription>
                </CardHeader>
                <CardContent>
                <ul>
                        <li></li>
                        <li></li>
                        <li></li>
                        <li></li>
                    </ul>
                </CardContent>
            </Card>
      
           </div>


        </div>

        
    );
}