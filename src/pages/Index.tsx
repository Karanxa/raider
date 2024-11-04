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
import BountyReporting from "@/components/bounty/BountyReporting";
import PostmanDashboard from "@/components/postman/PostmanDashboard";
import TurboIntruderGenerator from "@/components/turbo-intruder/TurboIntruderGenerator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import IPIntelligence from "@/components/ip-intelligence/IPIntelligence";

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
            <TabsList className="grid w-full grid-cols-4 mb-4 sm:mb-6">
              <TabsTrigger value="web" className="text-sm sm:text-base py-2">Web Security</TabsTrigger>
              <TabsTrigger value="genai" className="text-sm sm:text-base py-2">GenAI Security</TabsTrigger>
              <TabsTrigger value="mobile" className="text-sm sm:text-base py-2">Mobile Security</TabsTrigger>
              <TabsTrigger value="bounty" className="text-sm sm:text-base py-2">Bounty</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {activeCategory === "web" ? (
          <Tabs defaultValue="recon" className="w-full">
            <ScrollArea className="w-full whitespace-nowrap rounded-md border">
              <div className="flex p-1">
                <TabsList className="inline-flex h-9 items-center justify-center rounded-none bg-transparent p-0">
                  <TabsTrigger value="recon">Domain Recon</TabsTrigger>
                  <TabsTrigger value="recon-results">Recon Results</TabsTrigger>
                  <TabsTrigger value="nuclei">Nuclei Scanner</TabsTrigger>
                  <TabsTrigger value="nuclei-results">Nuclei Results</TabsTrigger>
                  <TabsTrigger value="postman">Postman Collections</TabsTrigger>
                  <TabsTrigger value="turbo-intruder">Turbo Intruder</TabsTrigger>
                  <TabsTrigger value="ip-intelligence">IP Intelligence</TabsTrigger>
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
              <TabsContent value="postman">
                <PostmanDashboard />
              </TabsContent>
              <TabsContent value="turbo-intruder">
                <TurboIntruderGenerator />
              </TabsContent>
              <TabsContent value="ip-intelligence">
                <IPIntelligence />
              </TabsContent>
            </div>
          </Tabs>
        ) : activeCategory === "genai" ? (
          <Tabs defaultValue="llm" className="w-full">
            <ScrollArea className="w-full whitespace-nowrap rounded-md border">
              <div className="flex p-1">
                <TabsList className="inline-flex h-9 items-center justify-center rounded-none bg-transparent p-0">
                  <TabsTrigger value="llm">LLM Scanner</TabsTrigger>
                  <TabsTrigger value="llm-results">LLM Results</TabsTrigger>
                  <TabsTrigger value="datasets">Datasets</TabsTrigger>
                  <TabsTrigger value="prompt-augmentation">Prompt Augmentation</TabsTrigger>
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
        ) : activeCategory === "mobile" ? (
          <Tabs defaultValue="upload" className="w-full">
            <ScrollArea className="w-full whitespace-nowrap rounded-md border">
              <div className="flex p-1">
                <TabsList className="inline-flex h-9 items-center justify-center rounded-none bg-transparent p-0">
                  <TabsTrigger value="upload">APK Upload</TabsTrigger>
                  <TabsTrigger value="dashboard">APK Dashboard</TabsTrigger>
                </TabsList>
              </div>
              <ScrollBar orientation="horizontal" className="h-2.5" />
            </ScrollArea>
            <div className="mt-4">
              <TabsContent value="upload">
                <ApkUpload />
              </TabsContent>
              <TabsContent value="dashboard">
                <ApkDashboard />
              </TabsContent>
            </div>
          </Tabs>
        ) : (
          <Tabs defaultValue="reporting" className="w-full">
            <ScrollArea className="w-full whitespace-nowrap rounded-md border">
              <div className="flex p-1">
                <TabsList className="inline-flex h-9 items-center justify-center rounded-none bg-transparent p-0">
                  <TabsTrigger value="reporting">Reporting</TabsTrigger>
                </TabsList>
              </div>
              <ScrollBar orientation="horizontal" className="h-2.5" />
            </ScrollArea>
            <div className="mt-4">
              <TabsContent value="reporting">
                <BountyReporting />
              </TabsContent>
            </div>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Index;
