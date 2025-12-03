import React from "react";
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
          <p>System settings and configurations will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default System;
