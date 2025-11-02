import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APITester } from "@/APITester";


export const Api = () => {
  

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">API</h1>
        <p className="text-muted-foreground">Overview of client API endpoints</p>
      </div>

    <div className="flex flex-col gap-4">
      <APITester />
    </div>

    </div>
  );
};
