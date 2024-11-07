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
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface OWASPResult {
  id: string;
  vulnerability_type: string;
  severity: string;
  description: string;
  recommendation: string;
  owasp_category: string;
}

export const OWASPResults = ({ targetUrl }: { targetUrl: string }) => {
  const { data: results, isLoading } = useQuery({
    queryKey: ['owasp-results', targetUrl],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_security_issues')
        .select('*')
        .eq('target_url', targetUrl)
        .order('severity', { ascending: false });

      if (error) throw error;
      return data as OWASPResult[];
    },
    enabled: !!targetUrl,
  });

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  if (!results?.length) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <CheckCircle className="h-12 w-12 text-green-500" />
          <h3 className="text-lg font-semibold">No Security Issues Found</h3>
          <p className="text-sm text-muted-foreground">
            The scan completed successfully but no security vulnerabilities were detected.
          </p>
        </div>
      </Card>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <XCircle className="h-4 w-4" />;
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Security Scan Results</h3>
          <Badge variant="outline">
            {results.length} {results.length === 1 ? 'Issue' : 'Issues'} Found
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Severity</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Recommendation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result) => (
              <TableRow key={result.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getSeverityIcon(result.severity)}
                    <Badge className={`${getSeverityColor(result.severity)}`}>
                      {result.severity}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{result.owasp_category}</TableCell>
                <TableCell className="max-w-md">{result.description}</TableCell>
                <TableCell className="max-w-md">{result.recommendation}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};