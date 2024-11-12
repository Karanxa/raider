import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";

interface ExportDialogProps {
  results: any[];
  onExport?: () => void;
}

export const ExportDialog = ({ results, onExport }: ExportDialogProps) => {
  const [exportType, setExportType] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);
  const session = useSession();

  const handleExport = async () => {
    if (!session?.user?.id) {
      toast.error("Please login to export results");
      return;
    }

    if (!exportType) {
      toast.error("Please select an export type");
      return;
    }

    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-results', {
        body: { 
          results,
          exportType,
          userId: session.user.id
        }
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
      }

      toast.success("Results exported successfully!");
      onExport?.();
    } catch (error) {
      console.error('Error exporting results:', error);
      toast.error("Failed to export results");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Export Results</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Results</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Export Type</Label>
            <Select
              value={exportType}
              onValueChange={setExportType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select export type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV File</SelectItem>
                <SelectItem value="jira">Jira Ticket</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleExport}
            disabled={isExporting || !exportType}
            className="w-full"
          >
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};