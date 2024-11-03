import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DomainInput from "@/components/DomainInput";
import Dashboard from "@/components/Dashboard";
import { Domain } from "@/types/domain";

const Index = () => {
  const [domains, setDomains] = useState<Domain[]>([]);

  const handleDomainSubmit = (domain: Domain) => {
    setDomains((prev) => [...prev, domain]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Domain Reconnaissance Dashboard</h1>
        
        <Tabs defaultValue="input" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="input">Domain Input</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          </TabsList>
          
          <TabsContent value="input">
            <DomainInput onSubmit={handleDomainSubmit} />
          </TabsContent>
          
          <TabsContent value="dashboard">
            <Dashboard domains={domains} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;