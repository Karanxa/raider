import { useParams } from "react-router-dom";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ResponsiveTabs } from "@/components/navigation/ResponsiveTabs";
import { CentralPanel } from "@/components/navigation/CentralPanel";
import { Dashboard } from "@/components/Dashboard";
import { APISecurityContent } from "@/components/api-security/APISecurityContent";
import { LLMScanner } from "@/components/LLMScanner";
import { LLMResultsDashboard } from "@/components/LLMResultsDashboard";
import { PromptAugmentation } from "@/components/PromptAugmentation";
import { NucleiScanner } from "@/components/NucleiScanner";
import { NucleiResults } from "@/components/NucleiResults";
import { ReconResults } from "@/components/ReconResults";
import { ModelSecurityTesting } from "@/components/genai/ModelSecurityTesting";
import { FineTuning } from "@/components/genai/finetuning/FineTuning";
import { Datasets } from "@/components/Datasets";
import { XSSPayloads } from "@/components/xss/XSSPayloads";
import { CodeSnippetAnalysis } from "@/components/xss/CodeSnippetAnalysis";
import { DynamicXSSAnalysis } from "@/components/xss/DynamicXSSAnalysis";
import { PostmanDashboard } from "@/components/postman/PostmanDashboard";

const Index = () => {
  const { category = "dashboard", tab } = useParams();

  return (
    <div className="flex flex-col space-y-4">
      <ResponsiveTabs defaultValue={category} />
      <Tabs value={category} className="flex-1">
        <TabsContent value="dashboard" className="m-0">
          <CentralPanel>
            <Dashboard />
          </CentralPanel>
        </TabsContent>

        <TabsContent value="api-security" className="m-0">
          <APISecurityContent />
        </TabsContent>

        <TabsContent value="llm-security" className="m-0">
          <CentralPanel>
            {!tab && <LLMScanner />}
            {tab === "llm-results" && <LLMResultsDashboard />}
            {tab === "datasets" && <Datasets />}
            {tab === "prompt-augmentation" && <PromptAugmentation />}
            {tab === "finetuning" && <FineTuning />}
            {tab === "model-security" && <ModelSecurityTesting />}
          </CentralPanel>
        </TabsContent>

        <TabsContent value="web-security" className="m-0">
          <CentralPanel>
            {!tab && <NucleiScanner />}
            {tab === "nuclei-results" && <NucleiResults />}
            {tab === "recon-results" && <ReconResults />}
            {tab === "postman" && <PostmanDashboard />}
          </CentralPanel>
        </TabsContent>

        <TabsContent value="xss" className="m-0">
          <CentralPanel>
            {!tab && <XSSPayloads />}
            {tab === "code-analysis" && <CodeSnippetAnalysis />}
            {tab === "dynamic-analysis" && <DynamicXSSAnalysis />}
          </CentralPanel>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;