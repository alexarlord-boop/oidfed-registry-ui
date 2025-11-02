import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APITester } from "../../APITester";

import logo from "../../logo.svg";
import reactLogo from "../../react.svg";

export function Home() {
  return (
    <div className="w-full text-center grid gap-4">
      
      <Card>
        <CardHeader className="gap-4">
          <CardTitle className="text-3xl font-bold">OIDFed Registry</CardTitle>
          <CardDescription>
            Welcome to the OIDFED Registry UI
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* content */}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-4">
          <CardTitle className="text-3xl font-bold">OIDFed Registry</CardTitle>
          <CardDescription>
            Welcome to the OIDFED Registry UI
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* content */}
        </CardContent>
      </Card>
    </div>
  );
}

