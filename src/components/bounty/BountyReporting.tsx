import { useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { Download } from "lucide-react";

const BountyReporting = () => {
  const session = useSession();
  const [summary, setSummary] = useState("");
  const [severity, setSeverity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);

  const generateStructuredReport = (summary: string) => {
    // Extract steps to reproduce
    let steps: string[] = [];
    
    // Look for numbered steps (e.g., "1.", "2.", etc.)
    const numberedSteps = summary.match(/\d+\.\s*[^.!?]+[.!?]/g);
    if (numberedSteps) {
      steps = numberedSteps.map(step => step.trim());
    } else {
      // Look for sequential markers (first, then, next, finally, etc.)
      const sequentialMarkers = summary.match(/(?:first|then|next|after|finally)[^.!?]+[.!?]/gi);
      if (sequentialMarkers) {
        steps = sequentialMarkers.map(step => step.trim());
      } else {
        // If no explicit steps found, try to break into logical sequences
        steps = summary
          .split(/[.!?]+/)
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.toLowerCase().includes("impact") && !s.toLowerCase().includes("proof"))
          .map((s, i) => `${i + 1}. ${s}`);
      }
    }

    // Extract impact - look for explicit impact statements first
    let impact = "";
    const impactPatterns = [
      /impact[^.!?]+[.!?]/i,
      /(?:results? in|leads? to|causes?|affects?|compromises?)[^.!?]+[.!?]/i,
      /(?:could|would|might|can|may)[^.!?]+[.!?]/i
    ];

    for (const pattern of impactPatterns) {
      const match = summary.match(pattern);
      if (match) {
        impact = match[0].trim();
        break;
      }
    }

    if (!impact) {
      // If no explicit impact found, use AI to infer the impact
      impact = "Potential security impact needs to be assessed based on the provided information.";
    }

    // Look for proof of concept or references
    const proofPatterns = [
      /(?:proof|evidence|log|screenshot|attachment|reference)[^.!?]+[.!?]/i,
      /(?:demonstrated|shown|verified|confirmed)[^.!?]+[.!?]/i
    ];

    let proofOfConcept = "";
    for (const pattern of proofPatterns) {
      const match = summary.match(pattern);
      if (match) {
        proofOfConcept = match[0].trim();
        break;
      }
    }

    // Generate recommendations based on severity and impact
    const recommendations = `Based on the identified ${severity || "potential"} severity vulnerability, 
      we recommend conducting a thorough security assessment of the affected components and implementing 
      appropriate security controls to mitigate the risk.`;

    return {
      description: summary,
      steps_to_reproduce: steps.join("\n"),
      impact,
      proof_of_concept: proofOfConcept,
      recommendations,
    };
  };

  const exportReport = (format: 'doc' | 'pdf' | 'md') => {
    if (!generatedReport) {
      toast.error("Please generate a report first");
      return;
    }

    const reportContent = `# Security Vulnerability Report

## Title
${generatedReport.title}

## Description
${generatedReport.description}

## Steps to Reproduce
${generatedReport.steps_to_reproduce}

## Impact
${generatedReport.impact}

## Proof of Concept
${generatedReport.proof_of_concept || 'No proof of concept provided'}

## Recommendations
${generatedReport.recommendations}

## Severity
${generatedReport.severity}
`;

    try {
      switch (format) {
        case 'doc':
          const docBlob = new Blob([reportContent], { type: 'application/msword' });
          const docUrl = URL.createObjectURL(docBlob);
          const docLink = document.createElement('a');
          docLink.href = docUrl;
          docLink.download = 'vulnerability_report.doc';
          docLink.click();
          break;

        case 'pdf':
          const pdf = new jsPDF();
          const splitText = pdf.splitTextToSize(reportContent, 180);
          pdf.text(splitText, 15, 15);
          pdf.save('vulnerability_report.pdf');
          break;

        case 'md':
          const mdBlob = new Blob([reportContent], { type: 'text/markdown' });
          const mdUrl = URL.createObjectURL(mdBlob);
          const mdLink = document.createElement('a');
          mdLink.href = mdUrl;
          mdLink.download = 'vulnerability_report.md';
          mdLink.click();
          break;
      }
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export report as ${format.toUpperCase()}`);
    }
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
      const title = summary.split(/[.!?]/)[0].trim();

      const reportData = {
        user_id: session.user.id,
        title: title.length > 10 ? title : summary.substring(0, 100),
        description: structuredReport.description,
        steps_to_reproduce: structuredReport.steps_to_reproduce,
        impact: structuredReport.impact,
        proof_of_concept: structuredReport.proof_of_concept,
        recommendations: structuredReport.recommendations,
        severity,
      };

      const { error } = await supabase.from("bounty_reports").insert(reportData);

      if (error) throw error;

      setGeneratedReport({ ...reportData, title: reportData.title });
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
              placeholder="Describe the vulnerability in detail. Include any steps to reproduce, potential impact, and supporting evidence. Our system will automatically structure your report."
              className="min-h-[200px] resize-y text-base p-4"
              required
            />
            <p className="text-sm text-muted-foreground mt-2">
              Provide a comprehensive description. The system will automatically extract steps, impact, and evidence from your summary.
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
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => exportReport('doc')}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  DOC
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => exportReport('pdf')}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => exportReport('md')}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  MD
                </Button>
              </div>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
};

export default BountyReporting;
