import { useState, useEffect } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { categoryConfigs } from "@/components/navigation/TabConfig";
import { useRBAC } from "@/hooks/useRBAC";
import { CentralPanel } from "@/components/navigation/CentralPanel";
import DomainRecon from "@/components/DomainRecon";
import ReconResults from "@/components/ReconResults";
import LLMScanner from "@/components/LLMScanner";
import LLMResultsDashboard from "@/components/LLMResultsDashboard";
import NucleiScanner from "@/components/NucleiScanner";
import NucleiResults from "@/components/NucleiResults";
import Datasets from "@/components/Datasets";
import PromptAugmentation from "@/components/PromptAugmentation";
import BountyReporting from "@/components/bounty/BountyReporting";
import PostmanDashboard from "@/components/postman/PostmanDashboard";
import TurboIntruderGenerator from "@/components/turbo-intruder/TurboIntruderGenerator";
import XSSPayloads from "@/components/xss/XSSPayloads";
import IPIntelligence from "@/components/ip-intelligence/IPIntelligence";
import ApkUpload from "@/components/mobile/ApkUpload";
import ApkDashboard from "@/components/mobile/ApkDashboard";
import { FineTuning } from "@/components/genai/finetuning/FineTuning";
import { GitHubScanner } from "@/components/api-security/GitHubScanner";
import { APIFindings } from "@/components/api-security/APIFindings";

const Index = () => {
  const navigate = useNavigate();
  const { hasAccess, loading: rbacLoading } = useRBAC();
  const { category, tab } = useParams();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  const renderContent = (value: string) => {
    switch (value) {
      case "recon": return <DomainRecon />;
      case "recon-results": return <ReconResults />;
      case "nuclei": return <NucleiScanner />;
      case "nuclei-results": return <NucleiResults domain={null} />;
      case "postman": return <PostmanDashboard />;
      case "turbo-intruder": return <TurboIntruderGenerator />;
      case "ip-intelligence": return <IPIntelligence />;
      case "xss": return <XSSPayloads />;
      case "llm": return <LLMScanner />;
      case "llm-results": return <LLMResultsDashboard />;
      case "datasets": return <Datasets />;
      case "prompt-augmentation": return <PromptAugmentation />;
      case "upload": return <ApkUpload />;
      case "dashboard": return <ApkDashboard />;
      case "reporting": return <BountyReporting />;
      case "finetuning": return <FineTuning />;
      case "github-scan": return <GitHubScanner />;
      case "api-findings": return <APIFindings />;
      default: return null;
    }
  };

  if (rbacLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-foreground">Raider</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
        
        <CentralPanel>
          {tab && (
            <Tabs value={tab} className="w-full">
              <TabsContent value={tab}>
                {renderContent(tab)}
              </TabsContent>
            </Tabs>
          )}
        </CentralPanel>
      </div>
    </div>
  );
};

export default Index;
