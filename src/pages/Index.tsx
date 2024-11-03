import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DomainRecon from "@/components/DomainRecon";
import ReconResults from "@/components/ReconResults";
import LLMScanner from "@/components/LLMScanner";
import LLMResultsDashboard from "@/components/LLMResultsDashboard";
import NucleiScanner from "@/components/NucleiScanner";
import NucleiResults from "@/components/NucleiResults";
import Datasets from "@/components/Datasets";
import PromptAugmentation from "@/components/PromptAugmentation";
import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  const navigate = useNavigate();

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
      <div className="container mx-auto py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Simrata</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="recon" className="w-full">
          <div className="mb-6 overflow-x-auto">
            <TabsList className="inline-flex w-full sm:w-auto h-auto p-1 gap-1 flex-wrap sm:flex-nowrap">
              <TabsTrigger 
                value="recon" 
                className="flex-1 sm:flex-none px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Domain Recon
              </TabsTrigger>
              <TabsTrigger 
                value="recon-results" 
                className="flex-1 sm:flex-none px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Recon Results
              </TabsTrigger>
              <TabsTrigger 
                value="nuclei" 
                className="flex-1 sm:flex-none px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Nuclei Scanner
              </TabsTrigger>
              <TabsTrigger 
                value="nuclei-results" 
                className="flex-1 sm:flex-none px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Nuclei Results
              </TabsTrigger>
              <TabsTrigger 
                value="llm" 
                className="flex-1 sm:flex-none px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                LLM Scanner
              </TabsTrigger>
              <TabsTrigger 
                value="llm-results" 
                className="flex-1 sm:flex-none px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                LLM Results
              </TabsTrigger>
              <TabsTrigger 
                value="datasets" 
                className="flex-1 sm:flex-none px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Datasets
              </TabsTrigger>
              <TabsTrigger 
                value="prompt-augmentation" 
                className="flex-1 sm:flex-none px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Prompt Augmentation
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="mt-4">
            <TabsContent value="recon" className="m-0">
              <DomainRecon />
            </TabsContent>
            
            <TabsContent value="recon-results" className="m-0">
              <ReconResults />
            </TabsContent>

            <TabsContent value="nuclei" className="m-0">
              <NucleiScanner />
            </TabsContent>

            <TabsContent value="nuclei-results" className="m-0">
              <NucleiResults domain={null} />
            </TabsContent>

            <TabsContent value="llm" className="m-0">
              <LLMScanner />
            </TabsContent>

            <TabsContent value="llm-results" className="m-0">
              <LLMResultsDashboard />
            </TabsContent>

            <TabsContent value="datasets" className="m-0">
              <Datasets />
            </TabsContent>

            <TabsContent value="prompt-augmentation" className="m-0">
              <PromptAugmentation />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;