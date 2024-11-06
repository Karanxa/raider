import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface APIFinding {
  id: string;
  repository_name: string;
  api_path: string;
  method: string;
  file_path: string;
  line_number: number;
  repository_url: string;
  pii_classification: boolean;
  pii_types: string[];
}

interface APIFindingsTableProps {
  findings: APIFinding[];
  isLoading: boolean;
}

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

const getGitHubLineLink = (repoUrl: string, filePath: string, lineNumber: number) => {
  // Convert repository URL to raw file URL format
  // Example: https://github.com/owner/repo -> https://github.com/owner/repo/blob/main/path/to/file#L123
  const baseUrl = repoUrl.replace(/\.git$/, '');
  return `${baseUrl}/blob/main/${filePath}#L${lineNumber}`;
};

export const APIFindingsTable = ({ findings, isLoading }: APIFindingsTableProps) => {
  if (isLoading) {
    return <div className="text-center py-8">Loading findings...</div>;
  }

  if (findings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No API findings yet. Try scanning some repositories first.
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">Method</TableHead>
            <TableHead className="whitespace-nowrap">API Path</TableHead>
            <TableHead className="whitespace-nowrap">PII Types</TableHead>
            <TableHead className="whitespace-nowrap">Repository</TableHead>
            <TableHead className="whitespace-nowrap">Location</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {findings.map((finding) => (
            <TableRow key={finding.id}>
              <TableCell className="whitespace-nowrap">
                <Badge className={getMethodColor(finding.method)}>
                  {finding.method}
                </Badge>
              </TableCell>
              <TableCell className="font-mono min-w-[200px]">
                {finding.api_path}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {finding.pii_classification && (
                    <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                  )}
                  <div className="flex flex-wrap gap-1">
                    {finding.pii_types?.map((type) => (
                      <Badge key={type} variant="outline" className="bg-yellow-500/10 whitespace-nowrap">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {finding.repository_name}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <a
                  href={getGitHubLineLink(finding.repository_url, finding.file_path, finding.line_number)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {finding.file_path}:{finding.line_number}
                </a>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};