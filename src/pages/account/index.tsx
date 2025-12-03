import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/UserAvatar";
import { useAuth } from "@/hooks/useAuth";
import { TokenDebug } from "@/components/TokenDebug";

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
                    
                    <UserAvatar
                      name={user?.username || 'User'}
                      src={user?.oidc_provider === 'github' ? `https://github.com/${user?.username}.png` : null}
                      size="xl"
                    />

                    <ul>
                        <li>Contact info for federation communications</li>
                        <li>Organizational affiliation</li>
                        <li>Job title/role for audit trails</li>
                        <li>Department for internal routing</li>
                    </ul>

                </CardContent>
            </Card>
            
           <div className="col-span-2">
               <TokenDebug />
           </div>
           


            
        
      
           </div>


        </div>

        
    );
}