import { useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const BountyReporting = () => {
  const session = useSession();
  const [summary, setSummary] = useState("");
  const [severity, setSeverity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateStructuredReport = (summary: string) => {
    // Extract potential steps from summary by looking for numbered items or sequences
    const stepsPattern = summary.match(/(?:\d+\.\s*[^.!?]+[.!?])|(?:first[^.!?]+[.!?])|(?:then[^.!?]+[.!?])|(?:finally[^.!?]+[.!?])/gi);
    const steps = stepsPattern ? stepsPattern.map(step => step.trim()) : ["No specific steps provided"];

    // Extract impact by looking for consequences or results
    const impactPattern = summary.match(/(?:impact|result|cause|lead to|affect|could|would|might)[^.!?]+[.!?]/i);
    const impact = impactPattern ? impactPattern[0].trim() : "Impact needs to be assessed";

    // Look for any references or proof mentions
    const referencesPattern = summary.match(/(?:reference|proof|evidence|log|screenshot)[^.!?]+[.!?]/i);
    const references = referencesPattern ? [referencesPattern[0].trim()] : [];

    return {
      description: summary,
      steps_to_reproduce: steps.join("\n"),
      impact,
      proof_of_concept: references.join("\n"),
      recommendations: "Based on the identified vulnerability, we recommend conducting a thorough security assessment and implementing appropriate fixes.",
    };
  };

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

    setIsSubmitting(true);
    try {
      const structuredReport = generateStructuredReport(summary);
      const { error } = await supabase.from("bounty_reports").insert({
        user_id: session.user.id,
        title: summary.split(".")[0], // Use first sentence as title
        description: structuredReport.description,
        steps_to_reproduce: structuredReport.steps_to_reproduce,
        impact: structuredReport.impact,
        proof_of_concept: structuredReport.proof_of_concept,
        recommendations: structuredReport.recommendations,
        severity,
      });

      if (error) throw error;

      toast.success("Report submitted successfully!");
      setSummary("");
      setSeverity("");
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto p-4 sm:p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="summary">Vulnerability Summary *</Label>
          <Textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Describe the vulnerability in detail, including how to reproduce it, its impact, and any supporting evidence."
            className="min-h-[200px] resize-y"
            required
          />
          <p className="text-sm text-muted-foreground">
            Provide a comprehensive description of the vulnerability. Include steps to reproduce, potential impact, and any supporting material.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="severity">Severity *</Label>
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

        <Button 
          type="submit" 
          className="w-full sm:w-auto min-w-[200px]" 
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Generate & Submit Report"}
        </Button>
      </form>
    </Card>
  );
};

export default BountyReporting;