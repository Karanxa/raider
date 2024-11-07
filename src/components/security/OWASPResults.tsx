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

interface OWASPResult {
  id: string;
  vulnerability_type: string;
  severity: string;
  description: string;
  recommendation: string;
  owasp_category: string;
}

export const OWASPResults = () => {
  const { data: results, isLoading } = useQuery({
    queryKey: ['owasp-results'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_security_issues')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as OWASPResult[];
    },
  });

  if (isLoading) {
    return <div className="text-center py-4">Loading results...</div>;
  }

  if (!results?.length) {
    return (
      <Card className="p-4">
        <p className="text-center text-muted-foreground">
          No security scan results available yet.
        </p>
      </Card>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Category</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Recommendation</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((result) => (
          <TableRow key={result.id}>
            <TableCell>{result.owasp_category}</TableCell>
            <TableCell>{result.vulnerability_type}</TableCell>
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