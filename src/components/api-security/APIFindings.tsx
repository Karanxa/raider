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
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileCode, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface APIFinding {
  id: string;
  repository_name: string;
  repository_url: string;
  api_path: string;
  method: string;
  file_path: string;
  line_number: number | null;
  description: string | null;
  pii_classification: boolean;
  pii_types: string[];
  created_at: string;
}

export const APIFindings = () => {
  const session = useSession();

  const { data: findings, isLoading } = useQuery({
    queryKey: ['github-api-findings'],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      
      const { data, error } = await supabase
        .from('github_api_findings')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as APIFinding[];
    },
    enabled: !!session?.user?.id,
  });

  if (isLoading) {
    return (
      <Card className="p-4">
        <p className="text-center text-muted-foreground">Loading API findings...</p>
      </Card>
    );
  }

  if (!findings?.length) {
    return (
      <Card className="p-4">
        <p className="text-center text-muted-foreground">
          No API endpoints found yet. Use the GitHub Scanner to discover API endpoints in repositories.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">API Findings</h2>
        <Badge variant="outline">{findings.length} endpoints found</Badge>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Repository</TableHead>
              <TableHead>API Path</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>PII</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {findings.map((finding) => (
              <TableRow key={finding.id}>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <FileCode className="h-4 w-4" />
                    <span>{finding.repository_name}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {finding.api_path}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{finding.method}</Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {finding.file_path}
                    {finding.line_number && `:${finding.line_number}`}
                  </span>
                </TableCell>
                <TableCell>
                  {finding.pii_classification && (
                    <Badge variant="destructive">
                      PII Detected
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(finding.repository_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};