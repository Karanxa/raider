import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DomainInput from "@/components/DomainInput";
import Dashboard from "@/components/Dashboard";
import LLMScanner from "@/components/LLMScanner";
import { Domain } from "@/types/domain";

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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Domain Reconnaissance Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
        
        <Tabs defaultValue="input" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="input">Domain Input</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="llm">LLM Scanner</TabsTrigger>
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
        </Tabs>
      </div>
    </div>
  );
};

export default Index;