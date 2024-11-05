import React from "react";
import { useNavigate } from "react-router-dom";
import { ApiKeySettings } from "@/components/settings/ApiKeySettings";
import { UserManagement } from "@/components/settings/UserManagement";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRBAC } from "@/hooks/useRBAC";

const Settings = () => {
  const navigate = useNavigate();
  const { role } = useRBAC();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(-1)}
          className="hover:bg-accent"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      {role === 'superadmin' && (
        <Card className="p-6 mb-6">
          <UserManagement />
        </Card>
      )}

      <Card className="p-6">
        <ApiKeySettings />
      </Card>
    </div>
  );
};

export default Settings;