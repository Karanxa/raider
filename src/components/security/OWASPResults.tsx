import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@supabase/auth-helpers-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface OWASPResultsProps {
  targetUrl: string | null;
}

interface OWASPResult {
  id: string;
  vulnerability_type: string;
  severity: string;
  description: string;
  recommendation: string | null;
  owasp_category: string;
  finding_id: string;
  target_url: string;
}

export const OWASPResults = ({ targetUrl }: OWASPResultsProps) => {
  const session = useSession();

  const { data: results, isLoading } = useQuery({
    queryKey: ['owasp-results', targetUrl],
    queryFn: async () => {
      if (!session?.user?.id) return [];

      const query = supabase
        .from('api_security_issues')
        .select(`
          *,
          github_api_findings!inner (
            repository_name,
            api_path,
            method
          )
        `)
        .eq('user_id', session.user.id);

      if (targetUrl) {
        query.eq('target_url', targetUrl);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as OWASPResult[];
    },
    enabled: !!session?.user?.id,
  });

  if (isLoading) {
    return <div className="text-center py-4">Loading results...</div>;
  }

  if (!results?.length) {
    return (
      <Card className="p-4">
        <p className="text-center text-muted-foreground">
          No security vulnerabilities found yet. Run an OWASP scan on your API endpoints to detect issues.
        </p>
      </Card>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>API Endpoint</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Recommendation</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((result) => (
          <TableRow key={result.id}>
            <TableCell className="font-mono text-sm">
              {result.target_url}
            </TableCell>
            <TableCell>{result.owasp_category}</TableCell>
            <TableCell>
              <Badge
                variant={
                  result.severity === 'critical' ? 'destructive' :
                  result.severity === 'high' ? 'destructive' :
                  result.severity === 'medium' ? 'default' :
                  'secondary'
                }
              >
                {result.severity}
              </Badge>
            </TableCell>
            <TableCell className="max-w-md">{result.description}</TableCell>
            <TableCell className="max-w-md">{result.recommendation}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};