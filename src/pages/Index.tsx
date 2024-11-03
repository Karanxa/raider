import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DomainInput from "@/components/DomainInput";
import Dashboard from "@/components/Dashboard";
import LLMScanner from "@/components/LLMScanner";
import LLMResultsDashboard from "@/components/LLMResultsDashboard";
import { Domain } from "@/types/domain";
import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const navigate = useNavigate();

  const handleDomainSubmit = (domain: Domain) => {
    setDomains((prev) => [...prev, domain]);
  };

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
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Domain Reconnaissance</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="dashboard" className="w-full">
          <div className="mb-6 overflow-x-auto">
            <TabsList className="inline-flex w-full sm:w-auto h-auto p-1 gap-1 flex-wrap sm:flex-nowrap">
              <TabsTrigger 
                value="dashboard" 
                className="flex-1 sm:flex-none px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="input" 
                className="flex-1 sm:flex-none px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Domain Input
              </TabsTrigger>
              <TabsTrigger 
                value="llm" 
                className="flex-1 sm:flex-none px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                LLM Scanner
              </TabsTrigger>
              <TabsTrigger 
                value="results" 
                className="flex-1 sm:flex-none px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Results
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="mt-4">
            <TabsContent value="dashboard" className="m-0">
              <Dashboard domains={domains} />
            </TabsContent>
            
            <TabsContent value="input" className="m-0">
              <DomainInput onSubmit={handleDomainSubmit} />
            </TabsContent>

            <TabsContent value="llm" className="m-0">
              <LLMScanner />
            </TabsContent>

            <TabsContent value="results" className="m-0">
              <LLMResultsDashboard />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;