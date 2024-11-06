import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface APIFinding {
  id: string;
  repository_name: string;
  api_path: string;
  method: string;
  file_path: string;
  line_number: number;
  repository_url: string;
}

export const APIFindings = () => {
  const [findings, setFindings] = useState<APIFinding[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFindings();
  }, []);

  const fetchFindings = async () => {
    try {
      const { data, error } = await supabase
        .from('github_api_findings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFindings(data || []);
    } catch (error) {
      console.error('Error fetching API findings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFindings = findings.filter(finding =>
    finding.api_path.toLowerCase().includes(searchTerm.toLowerCase()) ||
    finding.repository_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    finding.method.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: "bg-blue-500",
      POST: "bg-green-500",
      PUT: "bg-yellow-500",
      DELETE: "bg-red-500",
      PATCH: "bg-purple-500"
    };
    return colors[method] || "bg-gray-500";
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">API Findings</h2>
        <p className="text-muted-foreground">
          Discovered API endpoints from your GitHub repositories.
        </p>
      </div>

      <Input
        placeholder="Search by API path, repository, or method..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-md"
      />

      {isLoading ? (
        <div>Loading findings...</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Method</TableHead>
                <TableHead>API Path</TableHead>
                <TableHead>Repository</TableHead>
                <TableHead>File Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFindings.map((finding) => (
                <TableRow key={finding.id}>
                  <TableCell>
                    <Badge className={getMethodColor(finding.method)}>
                      {finding.method}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">{finding.api_path}</TableCell>
                  <TableCell>
                    <a
                      href={finding.repository_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {finding.repository_name}
                    </a>
                  </TableCell>
                  <TableCell>
                    {finding.file_path}:{finding.line_number}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};