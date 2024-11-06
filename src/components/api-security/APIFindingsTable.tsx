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
            <TableHead className="whitespace-nowrap">Repository</TableHead>
            <TableHead className="whitespace-nowrap">File Location</TableHead>
            <TableHead className="whitespace-nowrap">PII Types</TableHead>
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
                <div className="flex items-center gap-2">
                  {finding.api_path}
                  {finding.pii_classification && (
                    <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                  )}
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <a
                  href={finding.repository_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {finding.repository_name}
                </a>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {finding.file_path}:{finding.line_number}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {finding.pii_types?.map((type) => (
                    <Badge key={type} variant="outline" className="bg-yellow-500/10 whitespace-nowrap">
                      {type}
                    </Badge>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};