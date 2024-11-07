import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APIFindings } from "./APIFindings";
import { GitHubScanner } from "./GitHubScanner";
import { OWASPResults } from "@/components/security/OWASPResults";
import { Card } from "@/components/ui/card";

export const SecurityDashboard = () => {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <GitHubScanner />
      </Card>

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
    </div>
  );
};