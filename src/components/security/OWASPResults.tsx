import { useQuery } from "@tanstack/react-query";
import { useSession } from "@supabase/auth-helpers-react";
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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface OWASPResult {
  id: string;
  vulnerability_type: string;
  severity: string;
  description: string;
  recommendation: string;
  owasp_category: string;
}

export const OWASPResults = () => {
  const session = useSession();
  const [isScanning, setIsScanning] = useState(false);

  const { data: results, isLoading, refetch } = useQuery({
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

  const handleScanAll = async () => {
    if (!session?.user?.id) {
      toast.error("Please sign in to use the scanner");
      return;
    }

    setIsScanning(true);

    try {
      // Get all API findings
      const { data: findings, error: findingsError } = await supabase
        .from('github_api_findings')
        .select('id');

      if (findingsError) throw findingsError;

      if (!findings?.length) {
        toast.error("No APIs found to scan");
        return;
      }

      // Run OWASP scan for each finding
      for (const finding of findings) {
        await supabase.functions.invoke('owasp-scan', {
          body: { 
            findingId: finding.id,
            userId: session.user.id
          }
        });
      }

      toast.success("OWASP scan completed for all APIs");
      refetch(); // Refresh the results
    } catch (error: any) {
      console.error('OWASP scan error:', error);
      toast.error(error.message || "Failed to complete OWASP scan");
    } finally {
      setIsScanning(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading results...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button 
          onClick={handleScanAll}
          disabled={isScanning}
        >
          {isScanning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scanning APIs...
            </>
          ) : (
            "Scan All APIs"
          )}
        </Button>
      </div>

      {!results?.length ? (
        <Card className="p-4">
          <p className="text-center text-muted-foreground">
            No security scan results available yet.
          </p>
        </Card>
      ) : (
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
      )}
    </div>
  );
};