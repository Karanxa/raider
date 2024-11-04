import { jsPDF } from "jspdf";
import { toast } from "sonner";

type ReportFormat = 'doc' | 'pdf' | 'md';

interface Report {
  title: string;
  description: string;
  steps_to_reproduce: string;
  impact: string;
  proof_of_concept: string;
  recommendations: string;
  severity: string;
}

export const exportReport = (format: ReportFormat, report: Report | null) => {
  if (!report) {
    toast.error("Please generate a report first");
    return;
  }

  // Markdown formatted content
  const markdownContent = `# Security Vulnerability Report

## Title
${report.title}

## Description
${report.description}

## Steps to Reproduce
${report.steps_to_reproduce}

## Impact
${report.impact}

## Proof of Concept
${report.proof_of_concept || 'No proof of concept provided'}

## Recommendations
${report.recommendations}

## Severity
${report.severity}
`;

  // Plain text content for PDF
  const plainContent = `Security Vulnerability Report

Title
${report.title}

Description
${report.description}

Steps to Reproduce
${report.steps_to_reproduce}

Impact
${report.impact}

Proof of Concept
${report.proof_of_concept || 'No proof of concept provided'}

Recommendations
${report.recommendations}

Severity
${report.severity}`;

  try {
    switch (format) {
      case 'doc':
        const docBlob = new Blob([plainContent], { type: 'application/msword' });
        const docUrl = URL.createObjectURL(docBlob);
        const docLink = document.createElement('a');
        docLink.href = docUrl;
        docLink.download = 'vulnerability_report.doc';
        docLink.click();
        break;

      case 'pdf':
        const pdf = new jsPDF();
        const splitText = pdf.splitTextToSize(plainContent, 180);
        pdf.text(splitText, 15, 15);
        pdf.save('vulnerability_report.pdf');
        break;

      case 'md':
        const mdBlob = new Blob([markdownContent], { type: 'text/markdown' });
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