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
import { Loader2 } from "lucide-react";

interface OWASPResultsProps {
  targetUrl: string | null;
}

interface OWASPResult {
  id: string;
  vulnerability_type: string;
  severity: string;
  description: string;
  recommendation: string;
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
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading results...</span>
        </div>
      </Card>
    );
  }

  if (!results?.length) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          No security vulnerabilities found for this API.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
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
    </Card>
  );
};