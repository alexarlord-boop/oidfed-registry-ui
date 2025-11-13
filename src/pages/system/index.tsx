import React from "react";
import DevLogin from "@/components/dev/DevLogin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const System: React.FC = () => {
  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>System</CardTitle>
          <CardDescription>Developer and runtime settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <DevLogin />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default System;
