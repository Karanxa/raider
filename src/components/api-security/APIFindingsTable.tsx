import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface APIFinding {
  id: string;
  repository_name: string;
  repository_owner: string;
  api_path: string;
  method: string;
  description: string;
  pii_classification: boolean;
  pii_types: string[];
  created_at: string;
}

interface APIFindingsTableProps {
  findings: APIFinding[];
}

export const APIFindingsTable = ({ findings }: APIFindingsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Repository</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>API Path</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>PII</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {findings.map((finding) => (
          <TableRow key={finding.id}>
            <TableCell>{finding.repository_name}</TableCell>
            <TableCell>{finding.repository_owner}</TableCell>
            <TableCell className="font-mono text-sm">{finding.api_path}</TableCell>
            <TableCell>
              <Badge variant={finding.method === 'GET' ? 'secondary' : 'default'}>
                {finding.method}
              </Badge>
            </TableCell>
            <TableCell>{finding.description}</TableCell>
            <TableCell>
              {finding.pii_classification && (
                <div className="space-y-1">
                  <Badge variant="destructive">Contains PII</Badge>
                  <div className="flex flex-wrap gap-1">
                    {finding.pii_types.map((type) => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TableCell>
            <TableCell>{new Date(finding.created_at).toLocaleDateString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};