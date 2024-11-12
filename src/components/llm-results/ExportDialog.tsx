import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@supabase/auth-helpers-react";
import Papa from 'papaparse';

interface ExportDialogProps {
  results: any[];
}

export const ExportDialog = ({ results }: ExportDialogProps) => {
  const [exportType, setExportType] = useState<string>("");
  const [jiraProject, setJiraProject] = useState("");
  const [jiraIssueType, setJiraIssueType] = useState("Task");
  const [jiraSummary, setJiraSummary] = useState("LLM Scan Results");
  const [isExporting, setIsExporting] = useState(false);
  const session = useSession();

  const handleExport = async () => {
    if (!session?.user?.id) {
      toast.error("Please login to export results");
      return;
    }

    setIsExporting(true);
    try {
      if (exportType === 'csv') {
        const csvData = results.map(result => ({
          prompt: result.prompt,
          result: result.result,
          provider: result.provider,
          model: result.model || '',
          scan_type: result.scan_type,
          batch_name: result.batch_name || '',
          label: result.label || '',
          created_at: new Date(result.created_at).toLocaleString(),
          response_status: result.response_status || '',
          raw_response: JSON.stringify(result.raw_response || ''),
        }));

        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `llm_scan_results_${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Results exported successfully");
      } else {
        const { error } = await supabase.functions.invoke('export-results', {
          body: {
            exportType,
            results,
            jiraProject,
            jiraIssueType,
            jiraSummary,
            userId: session.user.id,
          },
        });

        if (error) throw error;
        toast.success(`Results exported to ${exportType} successfully`);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export results to ${exportType}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Results
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Results</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Export Type</Label>
            <Select value={exportType} onValueChange={setExportType}>
              <SelectTrigger>
                <SelectValue placeholder="Select export type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV File</SelectItem>
                <SelectItem value="jira">Jira Ticket</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {exportType === 'jira' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Jira Project Key</Label>
                <Input
                  placeholder="Enter project key"
                  value={jiraProject}
                  onChange={(e) => setJiraProject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Issue Type</Label>
                <Select value={jiraIssueType} onValueChange={setJiraIssueType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Task">Task</SelectItem>
                    <SelectItem value="Story">Story</SelectItem>
                    <SelectItem value="Bug">Bug</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Summary</Label>
                <Input
                  placeholder="Enter issue summary"
                  value={jiraSummary}
                  onChange={(e) => setJiraSummary(e.target.value)}
                />
              </div>
            </div>
          )}

          <Button 
            className="w-full" 
            onClick={handleExport}
            disabled={isExporting || !exportType || (exportType === 'jira' && !jiraProject)}
          >
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};