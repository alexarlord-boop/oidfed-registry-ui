import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { makeDummyJwt, setDevAuth } from "@/lib/devAuth";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const from = location.state?.from?.pathname ?? "/";

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // simple dev login: accept admin/admin or any non-empty values
    if (!username) return setError("Username required");
    if (!password) return setError("Password required");

    // for demo, require admin/admin as default credentials but accept any credentials
    if (username !== "admin" || password !== "admin") {
      // allow but warn
      console.warn("Non-default credentials used for dev login");
    }

    const token = makeDummyJwt(username);
    setDevAuth(token, username);
    navigate(from, { replace: true });
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>Developer Login</CardTitle>
          <CardDescription>Demo-only login (defaults: admin / admin)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label>Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>

            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            {error && <div className="text-destructive">{error}</div>}

            <div className="flex gap-2">
              <Button type="submit">Sign in</Button>
              <Button variant="ghost" onClick={() => { setUsername('admin'); setPassword('admin'); }}>Use defaults</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default Login;
