import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface NucleiResult {
  id: string;
  domain: string;
  url: string;
  severity: string;
  finding_name: string;
  finding_description: string;
  matched_at: string;
  scan_timestamp: string;
}

interface NucleiResultsProps {
  domain: string;
}

const NucleiResults = ({ domain }: NucleiResultsProps) => {
  const [results, setResults] = useState<NucleiResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      const { data, error } = await supabase
        .from('nuclei_scan_results')
        .select('*')
        .eq('domain', domain)
        .order('scan_timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching Nuclei results:', error);
        return;
      }

      setResults(data || []);
      setLoading(false);
    };

    fetchResults();
  }, [domain]);

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
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

  if (loading) {
    return <div className="text-center py-4">Loading scan results...</div>;
  }

  if (results.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-center text-gray-500">No scan results available for this domain.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Security Scan Results</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Finding</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result) => (
            <TableRow key={result.id}>
              <TableCell className="font-medium">{result.finding_name}</TableCell>
              <TableCell>
                <Badge className={`${getSeverityColor(result.severity)}`}>
                  {result.severity || 'Unknown'}
                </Badge>
              </TableCell>
              <TableCell className="max-w-xs truncate">
                <a 
                  href={result.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {result.matched_at || result.url}
                </a>
              </TableCell>
              <TableCell className="max-w-md">{result.finding_description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default NucleiResults;