import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APITester } from "@/APITester";


export const Api = () => {
  

  return (
    <div className="w-full">
    <div className="flex flex-col gap-4">
      <APITester />
    </div>

    </div>
  );
};
