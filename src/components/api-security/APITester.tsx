import { useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface SecurityFinding {
  severity: 'high' | 'medium' | 'low';
  issue: string;
  description: string;
  recommendation: string;
}

export const APITester = () => {
  const [curlCommand, setCurlCommand] = useState("");
  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const session = useSession();

  const analyzeCurl = async () => {
    if (!session?.user?.id) {
      toast.error("Please login to use this feature");
      return;
    }

    if (!curlCommand.trim()) {
      toast.error("Please enter a curl command");
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-api', {
        body: { 
          curlCommand,
          userId: session.user.id
        }
      });

      if (error) throw error;

      setFindings(data.findings);
      toast.success("API analysis completed");
    } catch (error) {
      console.error('API analysis error:', error);
      toast.error("Failed to analyze API");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'medium':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <CheckCircle2 className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">API Security Tester</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Enter curl command
            </label>
            <Textarea
              placeholder="curl 'https://api.example.com/v1/data' -H 'Authorization: Bearer xyz'"
              value={curlCommand}
              onChange={(e) => setCurlCommand(e.target.value)}
              className="min-h-[100px] font-mono text-sm"
            />
          </div>
          
          <Button 
            onClick={analyzeCurl} 
            disabled={isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? "Analyzing..." : "Analyze API Security"}
          </Button>
        </div>
      </Card>

      {findings.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Security Analysis Results</h3>
          <div className="space-y-4">
            {findings.map((finding, index) => (
              <Alert key={index} variant="default" className="relative">
                <div className="flex items-start gap-4">
                  {getSeverityIcon(finding.severity)}
                  <div className="flex-1">
                    <h4 className={`font-medium mb-1 ${getSeverityColor(finding.severity)}`}>
                      {finding.issue}
                    </h4>
                    <AlertDescription className="mt-2 space-y-2">
                      <p className="text-sm text-muted-foreground">{finding.description}</p>
                      <p className="text-sm font-medium">Recommendation:</p>
                      <p className="text-sm text-muted-foreground">{finding.recommendation}</p>
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};