import { useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { generateAIReport } from "./report-generation/generateAIReport";
import { generateStructuredReport } from "./report-generation/generateStructuredReport";
import { ExportButtons } from "./report-export/ExportButtons";

const BountyReporting = () => {
  const session = useSession();
  const [summary, setSummary] = useState("");
  const [severity, setSeverity] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) {
      toast.error("Please login to submit reports");
      return;
    }

    if (!summary || !severity) {
      toast.error("Please provide a summary and severity level");
      return;
    }

    if (!apiKey) {
      toast.error("Please provide your OpenAI API key");
      return;
    }

    setIsSubmitting(true);
    try {
      const report = await generateAIReport(summary, severity, apiKey);
      
      const { error } = await supabase.from("bounty_reports").insert({
        user_id: session.user.id,
        title: report.title,
        description: report.description,
        steps_to_reproduce: report.steps_to_reproduce,
        impact: report.impact,
        proof_of_concept: report.proof_of_concept,
        recommendations: report.recommendations,
        severity,
      });

      if (error) throw error;

      setGeneratedReport(report);
      toast.success("Report generated successfully!");
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <Card className="w-full max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="summary" className="text-lg font-semibold">
              Vulnerability Summary *
            </Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Describe the vulnerability in detail. Include any steps to reproduce, potential impact, and supporting evidence. Our AI will help structure your report."
              className="min-h-[200px] resize-y text-base p-4"
              required
            />
            <p className="text-sm text-muted-foreground mt-2">
              Provide a comprehensive description. Our AI will help structure and enhance your report.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey" className="text-lg font-semibold">
              OpenAI API Key *
            </Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your OpenAI API key"
              required
            />
            <p className="text-sm text-muted-foreground mt-2">
              Your API key is used only for this request and is not stored
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="severity" className="text-lg font-semibold">
              Severity *
            </Label>
            <Select value={severity} onValueChange={setSeverity} required>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select severity level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="info">Informational</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              type="submit" 
              className="w-full sm:w-auto min-w-[200px]" 
              disabled={isSubmitting}
              size="lg"
            >
              {isSubmitting ? "Generating Report..." : "Generate & Submit Report"}
            </Button>

            {generatedReport && (
              <ExportButtons report={generatedReport} />
            )}
          </div>
        </form>
      </Card>
    </div>
  );
};

export default BountyReporting;