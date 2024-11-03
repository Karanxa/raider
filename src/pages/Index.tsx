import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
            <ScrollArea className="w-full whitespace-nowrap rounded-md border">
              <div className="flex p-1">
                <TabsList className="inline-flex h-9 items-center justify-center rounded-none bg-transparent p-0">
                  <TabsTrigger 
                    value="recon" 
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium ring-offset-background transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                  >
                    Domain Recon
                  </TabsTrigger>
                  <TabsTrigger 
                    value="recon-results"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium ring-offset-background transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                  >
                    Recon Results
                  </TabsTrigger>
                  <TabsTrigger 
                    value="nuclei"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium ring-offset-background transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                  >
                    Nuclei Scanner
                  </TabsTrigger>
                  <TabsTrigger 
                    value="nuclei-results"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium ring-offset-background transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                  >
                    Nuclei Results
                  </TabsTrigger>
                </TabsList>
              </div>
              <ScrollBar orientation="horizontal" className="h-2.5" />
            </ScrollArea>
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
            <ScrollArea className="w-full whitespace-nowrap rounded-md border">
              <div className="flex p-1">
                <TabsList className="inline-flex h-9 items-center justify-center rounded-none bg-transparent p-0">
                  <TabsTrigger 
                    value="llm"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium ring-offset-background transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                  >
                    LLM Scanner
                  </TabsTrigger>
                  <TabsTrigger 
                    value="llm-results"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium ring-offset-background transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                  >
                    LLM Results
                  </TabsTrigger>
                  <TabsTrigger 
                    value="datasets"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium ring-offset-background transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                  >
                    Datasets
                  </TabsTrigger>
                  <TabsTrigger 
                    value="prompt-augmentation"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium ring-offset-background transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                  >
                    Prompt Augmentation
                  </TabsTrigger>
                </TabsList>
              </div>
              <ScrollBar orientation="horizontal" className="h-2.5" />
            </ScrollArea>
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