import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
}

export const OWASPResults = ({ targetUrl }: OWASPResultsProps) => {
  const { data: results, isLoading } = useQuery({
    queryKey: ['owasp-results', targetUrl],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_security_issues')
        .select('*')
        .eq('target_url', targetUrl)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as OWASPResult[];
    },
    enabled: !!targetUrl,
  });

  if (isLoading) {
    return <div className="text-center py-4">Loading results...</div>;
  }

  if (!results?.length) {
    return (
      <Card className="p-4">
        <p className="text-center text-muted-foreground">
          No security scan results available for this API yet.
        </p>
      </Card>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Category</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Recommendation</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((result) => (
          <TableRow key={result.id}>
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