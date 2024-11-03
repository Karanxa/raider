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
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Domain Reconnaissance Dashboard</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="input" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="input">Domain Input</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="llm">LLM Scanner</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="input">
            <DomainInput onSubmit={handleDomainSubmit} />
          </TabsContent>
          
          <TabsContent value="dashboard">
            <Dashboard domains={domains} />
          </TabsContent>

          <TabsContent value="llm">
            <LLMScanner />
          </TabsContent>

          <TabsContent value="results">
            <LLMResultsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;