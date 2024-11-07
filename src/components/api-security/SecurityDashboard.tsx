import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APIFindings } from "./APIFindings";

export const SecurityDashboard = () => {
  return (
    <Tabs defaultValue="findings" className="space-y-4">
      <TabsList>
        <TabsTrigger value="findings">API Security Findings</TabsTrigger>
      </TabsList>
      
      <TabsContent value="findings">
        <APIFindings />
      </TabsContent>
    </Tabs>
  );
};