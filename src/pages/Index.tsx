import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
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
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import IPIntelligence from "@/components/ip-intelligence/IPIntelligence";
import ApkUpload from "@/components/mobile/ApkUpload";
import ApkDashboard from "@/components/mobile/ApkDashboard";
import { categoryConfigs } from "@/components/navigation/TabConfig";
import { ResponsiveTabs } from "@/components/navigation/ResponsiveTabs";
import { useRBAC } from "@/hooks/useRBAC";
import { FineTuning } from "@/components/genai/finetuning/FineTuning";

const Index = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("web");
  const { hasAccess, loading: rbacLoading } = useRBAC();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  const allowedCategories = categoryConfigs.filter(cat => hasAccess(cat.value));
  const currentCategory = allowedCategories.find(cat => cat.value === activeCategory);

  useEffect(() => {
    if (!rbacLoading && allowedCategories.length > 0 && !hasAccess(activeCategory)) {
      setActiveCategory(allowedCategories[0].value);
    }
  }, [rbacLoading, activeCategory, allowedCategories]);

  if (rbacLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

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
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Raider</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
        
        <div className="mb-4 sm:mb-6">
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-4 sm:mb-6">
              {allowedCategories.map((category) => (
                <TabsTrigger 
                  key={category.value} 
                  value={category.value} 
                  className="text-sm sm:text-base py-2 gap-2"
                >
                  {category.icon}
                  <span className="hidden sm:inline">{category.label}</span>
                  <span className="sm:hidden">{category.label.split(' ')[0]}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {currentCategory && (
          <Tabs defaultValue={currentCategory.tabs[0].value} className="w-full">
            <ResponsiveTabs tabs={currentCategory.tabs} />
            <div className="mt-4">
              {currentCategory.tabs.map((tab) => (
                <TabsContent key={tab.value} value={tab.value}>
                  {renderContent(tab.value)}
                </TabsContent>
              ))}
            </div>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Index;
