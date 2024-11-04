import React from "react";
import { useNavigate } from "react-router-dom";
import { ApiKeySettings } from "@/components/settings/ApiKeySettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const Settings = () => {
  const navigate = useNavigate();

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
      
      <Card className="p-6">
        <ApiKeySettings />
      </Card>

      <Card className="p-6">
        <NotificationSettings />
      </Card>
    </div>
  );
};

export default Settings;