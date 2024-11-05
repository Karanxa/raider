import { useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useApiKeys } from "@/hooks/useApiKeys";

const LANGUAGES = [
  "javascript",
  "typescript",
  "html",
  "php",
  "python",
  "java",
  "csharp",
  "ruby",
];

const DynamicXSSAnalysis = () => {
  const [codeSnippet, setCodeSnippet] = useState("");
  const [language, setLanguage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<{
    analysis: string;
    suggestedPayloads: string[];
    vulnerabilityPoints: string[];
  } | null>(null);
  const session = useSession();
  const { getApiKey } = useApiKeys();

  const analyzeCodeSnippet = async () => {
    if (!session?.user?.id) {
      toast.error("Please login to use this feature");
      return;
    }

    const openaiKey = getApiKey("openai");
    if (!openaiKey) {
      toast.error("Please add your OpenAI API key in Settings");
      return;
    }

    if (!codeSnippet || !language) {
      toast.error("Please provide both code snippet and language");
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-code-snippet', {
        body: {
          codeSnippet,
          language,
          apiKey: openaiKey,
          userId: session.user.id
        }
      });

      if (error) throw error;

      setAnalysis(data);
      toast.success("Analysis completed successfully!");
    } catch (error) {
      console.error("Error analyzing code snippet:", error);
      toast.error("Failed to analyze code snippet");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <Label>Programming Language</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Code Snippet</Label>
          <Textarea
            placeholder="Paste your code snippet here..."
            value={codeSnippet}
            onChange={(e) => setCodeSnippet(e.target.value)}
            className="min-h-[200px] font-mono"
          />
        </div>

        <Button 
          onClick={analyzeCodeSnippet}
          disabled={isAnalyzing}
          className="w-full"
        >
          {isAnalyzing ? "Analyzing..." : "Analyze for XSS Vulnerabilities"}
        </Button>

        {analysis && (
          <div className="space-y-6 mt-6">
            <div>
              <h3 className="font-semibold mb-2">Analysis</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{analysis.analysis}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Vulnerability Points</h3>
              <ul className="list-disc pl-4 space-y-1">
                {analysis.vulnerabilityPoints.map((point, index) => (
                  <li key={index} className="text-muted-foreground">{point}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Suggested XSS Payloads</h3>
              <div className="space-y-2">
                {analysis.suggestedPayloads.map((payload, index) => (
                  <div key={index} className="bg-muted p-2 rounded font-mono text-sm">
                    {payload}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DynamicXSSAnalysis;