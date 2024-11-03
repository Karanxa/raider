import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface ScanResult {
  id: string;
  prompt: string;
  result: string;
  provider: string;
  model: string | null;
  scan_type: 'manual' | 'batch';
  batch_id: string | null;
  created_at: string;
  batch_name: string | null;
  user_id: string;
  user_email: string | null;
}

const LLMResultsDashboard = () => {
  const [filterType, setFilterType] = useState<string>("all");

  const { data: results, isLoading } = useQuery({
    queryKey: ["llm-results", filterType],
    queryFn: async () => {
      let query = supabase
        .from('llm_scan_results')
        .select('*, user:user_id(profiles(email))')
        .order('created_at', { ascending: false });

      if (filterType === "manual") {
        query = query.eq('scan_type', 'manual');
      } else if (filterType === "batch") {
        query = query.eq('scan_type', 'batch');
      }

      const { data, error } = await query;
      if (error) throw error;

      return data.map(result => ({
        ...result,
        user_email: result.user?.profiles?.[0]?.email || null
      })) as ScanResult[];
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading results...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">LLM Scan Results</h2>
        <div className="w-[200px]">
          <Label>Filter by Type</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="Select filter type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Results</SelectItem>
              <SelectItem value="manual">Manual Prompts</SelectItem>
              <SelectItem value="batch">Batch Scans</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {results?.map((result) => (
          <Card key={result.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={result.scan_type === 'manual' ? 'default' : 'secondary'}>
                    {result.scan_type === 'manual' ? 'Manual Prompt' : 'Batch Scan'}
                  </Badge>
                  {result.batch_name && (
                    <Badge variant="outline">{result.batch_name}</Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(result.created_at).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Run by: {result.user_email || 'Unknown User'}
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline">{result.provider}</Badge>
                {result.model && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {result.model}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Prompt</Label>
                <div className="mt-1 text-sm bg-muted p-3 rounded-md">
                  {result.prompt}
                </div>
              </div>
              <div>
                <Label>Result</Label>
                <div className="mt-1 text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                  {result.result}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LLMResultsDashboard;