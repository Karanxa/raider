import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

interface Finding {
  id: string;
  repository_name: string;
  repository_owner: string;
  api_path: string;
  method: string;
  description?: string;
}

interface FindingsTableProps {
  findings: Finding[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

export const FindingsTable = ({ findings, currentPage, setCurrentPage }: FindingsTableProps) => {
  const queryClient = useQueryClient();

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('github_api_findings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['api-findings'] });
      toast.success('Finding deleted successfully');
      
      if (findings.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      console.error('Error deleting finding:', error);
      toast.error('Failed to delete finding');
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Repository</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>API Path</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {findings.map((finding) => (
          <TableRow key={finding.id}>
            <TableCell>{finding.repository_name}</TableCell>
            <TableCell>{finding.repository_owner}</TableCell>
            <TableCell className="font-mono text-sm">{finding.api_path}</TableCell>
            <TableCell>{finding.method}</TableCell>
            <TableCell>{finding.description || 'N/A'}</TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(finding.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};