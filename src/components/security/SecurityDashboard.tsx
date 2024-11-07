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
import { useSession } from "@supabase/auth-helpers-react";

export const SecurityDashboard = () => {
  const session = useSession();

  const { data: apiIssues, isLoading } = useQuery({
    queryKey: ['api-security-issues', session?.user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_security_issues')
        .select('*')
        .eq('user_id', session?.user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id,
  });

  if (isLoading) {
    return <div className="text-center py-4">Loading security issues...</div>;
  }

  if (!apiIssues?.length) {
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
      <h2 className="text-2xl font-bold">Security Issues</h2>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Recommendation</TableHead>
            <TableHead>OWASP Category</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apiIssues.map((issue) => (
            <TableRow key={issue.id}>
              <TableCell>{issue.vulnerability_type}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    issue.severity === 'critical' ? 'destructive' :
                    issue.severity === 'high' ? 'destructive' :
                    issue.severity === 'medium' ? 'default' :
                    'secondary'
                  }
                >
                  {issue.severity}
                </Badge>
              </TableCell>
              <TableCell className="max-w-md">{issue.description}</TableCell>
              <TableCell className="max-w-md">{issue.recommendation}</TableCell>
              <TableCell>{issue.owasp_category}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};