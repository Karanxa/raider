import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, AlertOctagon } from "lucide-react";

interface SecurityIssue {
  id: string;
  finding_id: string;
  vulnerability_type: string;
  severity: string;
  description: string;
  recommendation: string | null;
  owasp_category: string;
  target_url: string | null;
  created_at: string;
}

export const SecurityDashboard = () => {
  const { data: issues, isLoading } = useQuery({
    queryKey: ['security-issues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_security_issues')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SecurityIssue[];
    },
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <AlertOctagon className="h-4 w-4 text-destructive" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <p className="text-center text-muted-foreground">Loading security issues...</p>
      </Card>
    );
  }

  if (!issues?.length) {
    return (
      <Card className="p-4">
        <p className="text-center text-muted-foreground">
          No security issues found. Run a scan to detect potential vulnerabilities.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Security Issues</h2>
        <Badge variant="outline">{issues.length} issues found</Badge>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Severity</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Recommendation</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issues.map((issue) => (
            <TableRow key={issue.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getSeverityIcon(issue.severity)}
                  <span className="capitalize">{issue.severity}</span>
                </div>
              </TableCell>
              <TableCell>{issue.vulnerability_type}</TableCell>
              <TableCell>{issue.owasp_category}</TableCell>
              <TableCell className="max-w-md">{issue.description}</TableCell>
              <TableCell className="max-w-md">{issue.recommendation}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};