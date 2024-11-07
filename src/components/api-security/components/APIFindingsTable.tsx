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
  getMethodColor: (method: string) => string;
}

export const APIFindingsTable = ({ findings, getMethodColor }: APIFindingsTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Method</TableHead>
            <TableHead>API Path</TableHead>
            <TableHead>Repository</TableHead>
            <TableHead>File Location</TableHead>
            <TableHead>PII Types</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {findings.map((finding) => (
            <TableRow key={finding.id}>
              <TableCell>
                <Badge className={getMethodColor(finding.method)}>
                  {finding.method}
                </Badge>
              </TableCell>
              <TableCell className="font-mono">
                <div className="flex items-center gap-2">
                  {finding.api_path}
                  {finding.pii_classification && (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              </TableCell>
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
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {finding.pii_types?.map((type) => (
                    <Badge key={type} variant="outline" className="bg-yellow-500/10">
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