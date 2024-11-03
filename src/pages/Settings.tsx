import React from "react";
import { ApiKeySettings } from "@/components/settings/ApiKeySettings";
import { Card } from "@/components/ui/card";

const Settings = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>
      <Card className="p-6">
        <ApiKeySettings />
      </Card>
    </div>
  );
};

export default Settings;