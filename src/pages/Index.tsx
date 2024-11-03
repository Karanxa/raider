import { useState } from "react";
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
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("web");

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Simrata</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
        
        <div className="mb-4 sm:mb-6">
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
              <TabsTrigger value="web" className="text-sm sm:text-base py-2">Web Security</TabsTrigger>
              <TabsTrigger value="genai" className="text-sm sm:text-base py-2">GenAI Security</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {activeCategory === "web" ? (
          <Tabs defaultValue="recon" className="w-full">
            <div className="mb-4 overflow-x-auto scrollbar-hide">
              <TabsList className="inline-flex min-w-full sm:w-auto h-auto p-1 gap-1">
                <TabsTrigger value="recon" className="text-xs sm:text-sm whitespace-nowrap py-1.5">
                  Domain Recon
                </TabsTrigger>
                <TabsTrigger value="recon-results" className="text-xs sm:text-sm whitespace-nowrap py-1.5">
                  Recon Results
                </TabsTrigger>
                <TabsTrigger value="nuclei" className="text-xs sm:text-sm whitespace-nowrap py-1.5">
                  Nuclei Scanner
                </TabsTrigger>
                <TabsTrigger value="nuclei-results" className="text-xs sm:text-sm whitespace-nowrap py-1.5">
                  Nuclei Results
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="mt-4">
              <TabsContent value="recon">
                <DomainRecon />
              </TabsContent>
              <TabsContent value="recon-results">
                <ReconResults />
              </TabsContent>
              <TabsContent value="nuclei">
                <NucleiScanner />
              </TabsContent>
              <TabsContent value="nuclei-results">
                <NucleiResults domain={null} />
              </TabsContent>
            </div>
          </Tabs>
        ) : (
          <Tabs defaultValue="llm" className="w-full">
            <div className="mb-4 overflow-x-auto scrollbar-hide">
              <TabsList className="inline-flex min-w-full sm:w-auto h-auto p-1 gap-1">
                <TabsTrigger value="llm" className="text-xs sm:text-sm whitespace-nowrap py-1.5">
                  LLM Scanner
                </TabsTrigger>
                <TabsTrigger value="llm-results" className="text-xs sm:text-sm whitespace-nowrap py-1.5">
                  LLM Results
                </TabsTrigger>
                <TabsTrigger value="datasets" className="text-xs sm:text-sm whitespace-nowrap py-1.5">
                  Datasets
                </TabsTrigger>
                <TabsTrigger value="prompt-augmentation" className="text-xs sm:text-sm whitespace-nowrap py-1.5">
                  Prompt Augmentation
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="mt-4">
              <TabsContent value="llm">
                <LLMScanner />
              </TabsContent>
              <TabsContent value="llm-results">
                <LLMResultsDashboard />
              </TabsContent>
              <TabsContent value="datasets">
                <Datasets />
              </TabsContent>
              <TabsContent value="prompt-augmentation">
                <PromptAugmentation />
              </TabsContent>
            </div>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Index;