import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APIFindings } from "./APIFindings";
import { OWASPResults } from "@/components/security/OWASPResults";

export const SecurityDashboard = () => {
  return (
    <Tabs defaultValue="findings" className="space-y-4">
      <TabsList>
        <TabsTrigger value="findings">API Findings</TabsTrigger>
        <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
      </TabsList>
      
      <TabsContent value="findings">
        <APIFindings />
      </TabsContent>
      
      <TabsContent value="vulnerabilities">
        <OWASPResults targetUrl={null} />
      </TabsContent>
    </Tabs>
  );
};