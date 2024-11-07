import { useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface APIThreat {
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
}

export const APITester = () => {
  const [curlCommand, setCurlCommand] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [threats, setThreats] = useState<APIThreat[]>([]);
  const session = useSession();

  const handleAnalyze = async () => {
    if (!session?.user?.id) {
      toast.error("Please sign in to use the API tester");
      return;
    }

    if (!curlCommand) {
      toast.error("Please enter a curl command");
      return;
    }

    setAnalyzing(true);
    setThreats([]);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-api', {
        body: { 
          curlCommand,
          userId: session.user.id
        }
      });

      if (error) throw error;

      if (data?.threats) {
        setThreats(data.threats);
        toast.success("API analysis completed");
      }
    } catch (error: any) {
      console.error('API analysis error:', error);
      toast.error(error.message || "Failed to analyze API");
    } finally {
      setAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">API Tester</h3>
          <p className="text-sm text-muted-foreground">
            Enter a curl command to analyze potential security threats in your API endpoints.
          </p>
          <div className="space-y-2">
            <Textarea
              placeholder="Enter your curl command here..."
              value={curlCommand}
              onChange={(e) => setCurlCommand(e.target.value)}
              className="min-h-[100px] font-mono"
              disabled={analyzing}
            />
          </div>

          <Button 
            onClick={handleAnalyze} 
            disabled={analyzing}
            className="w-full"
          >
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing API...
              </>
            ) : (
              "Analyze API"
            )}
          </Button>
        </div>
      </Card>

      {threats.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Analysis Results</h3>
          {threats.map((threat, index) => (
            <Alert key={index} variant="destructive">
              <div className="flex items-center gap-2">
                <AlertTitle>{threat.title}</AlertTitle>
                <Badge className={`${getSeverityColor(threat.severity)} text-white`}>
                  {threat.severity}
                </Badge>
              </div>
              <AlertDescription className="mt-2 space-y-2">
                <p>{threat.description}</p>
                <p className="font-semibold">Recommendation:</p>
                <p>{threat.recommendation}</p>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
};