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
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Authentication is now handled through the login page using the Auth Gateway service.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default System;
