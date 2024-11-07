import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { ModelVulnerabilityReport } from "./ModelVulnerabilityReport";
import { SecurityTestForm } from "./SecurityTestForm";
import { TestResults } from "./types";

export const ModelSecurityTester = () => {
  const [results, setResults] = useState<TestResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const session = useSession();

  const handleTest = async (formData: {
    modelEndpoint: string;
    apiKey: string;
    testType: string;
    sampleInput: string;
    accessMethod: string;
    modelArchitecture?: string;
    modelWeights?: File;
    localModelPath?: string;
  }) => {
    if (!session?.user?.id) {
      toast.error("Please login to use this feature");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-model-security', {
        body: { 
          ...formData,
          userId: session.user.id 
        }
      });

      if (error) throw error;
      
      setResults(data);
      toast.success("Security test completed successfully");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to complete security test");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">ML Model Security Testing</h2>
      </div>

      <Card className="p-6">
        <SecurityTestForm onSubmit={handleTest} isLoading={isLoading} />
      </Card>

      {results && (
        <ModelVulnerabilityReport results={results} />
      )}
    </div>
  );
};