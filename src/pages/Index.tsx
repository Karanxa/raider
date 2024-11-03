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
        
        <div className="mb-6">
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="web">Web Security</TabsTrigger>
              <TabsTrigger value="genai">GenAI Tools</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {activeCategory === "web" ? (
          <Tabs defaultValue="recon" className="w-full">
            <div className="mb-6 overflow-x-auto">
              <TabsList className="inline-flex w-full sm:w-auto h-auto p-1 gap-1 flex-wrap sm:flex-nowrap">
                <TabsTrigger value="recon">Domain Recon</TabsTrigger>
                <TabsTrigger value="recon-results">Recon Results</TabsTrigger>
                <TabsTrigger value="nuclei">Nuclei Scanner</TabsTrigger>
                <TabsTrigger value="nuclei-results">Nuclei Results</TabsTrigger>
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
            <div className="mb-6 overflow-x-auto">
              <TabsList className="inline-flex w-full sm:w-auto h-auto p-1 gap-1 flex-wrap sm:flex-nowrap">
                <TabsTrigger value="llm">LLM Scanner</TabsTrigger>
                <TabsTrigger value="llm-results">LLM Results</TabsTrigger>
                <TabsTrigger value="datasets">Datasets</TabsTrigger>
                <TabsTrigger value="prompt-augmentation">Prompt Augmentation</TabsTrigger>
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