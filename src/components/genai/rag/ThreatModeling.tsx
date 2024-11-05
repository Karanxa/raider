import { useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useApiKeys } from "@/hooks/useApiKeys";

export const ThreatModeling = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<{
    threats: string[];
    recommendations: string[];
    securityControls: string[];
  } | null>(null);
  const session = useSession();
  const { getApiKey } = useApiKeys();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'application/pdf' || file.type === 'text/plain')) {
      setFile(file);
    } else {
      toast.error('Please upload a PDF or text file');
    }
  };

  const analyzeDocument = async () => {
    if (!session?.user?.id) {
      toast.error("Please login to use this feature");
      return;
    }

    const openaiKey = getApiKey("openai");
    if (!openaiKey) {
      toast.error("Please add your OpenAI API key in Settings");
      return;
    }

    if (!file) {
      toast.error("Please upload a document first");
      return;
    }

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', session.user.id);
      formData.append('apiKey', openaiKey);

      const { data, error } = await supabase.functions.invoke('analyze-document', {
        body: formData
      });

      if (error) throw error;
      setAnalysis(data);
      toast.success("Analysis completed successfully!");
    } catch (error) {
      console.error("Error analyzing document:", error);
      toast.error("Failed to analyze document");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Document Threat Analysis</h2>
          <p className="text-muted-foreground">
            Upload architecture documents or PRDs for comprehensive threat analysis
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Upload Document</Label>
            <Input
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileUpload}
              className="cursor-pointer"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Supported formats: PDF, TXT
            </p>
          </div>

          <Button 
            onClick={analyzeDocument}
            disabled={isAnalyzing || !file}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Document...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Analyze Document
              </>
            )}
          </Button>
        </div>

        {analysis && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Identified Threats</h3>
              <ScrollArea className="h-[200px]">
                <ul className="list-disc pl-4 space-y-2">
                  {analysis.threats.map((threat, index) => (
                    <li key={index} className="text-muted-foreground">{threat}</li>
                  ))}
                </ul>
              </ScrollArea>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Security Controls</h3>
              <ScrollArea className="h-[200px]">
                <ul className="list-disc pl-4 space-y-2">
                  {analysis.securityControls.map((control, index) => (
                    <li key={index} className="text-muted-foreground">{control}</li>
                  ))}
                </ul>
              </ScrollArea>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Recommendations</h3>
              <ScrollArea className="h-[200px]">
                <ul className="list-disc pl-4 space-y-2">
                  {analysis.recommendations.map((rec, index) => (
                    <li key={index} className="text-muted-foreground">{rec}</li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};