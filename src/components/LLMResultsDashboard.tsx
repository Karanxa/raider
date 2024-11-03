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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Papa from 'papaparse';

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
  label: string | null;
}

const LLMResultsDashboard = () => {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterLabel, setFilterLabel] = useState<string>("");
  const [newLabel, setNewLabel] = useState<string>("");
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const batchId = location.state?.batchId;

  const { data: results, isLoading, error } = useQuery({
    queryKey: ["llm-results", filterType, filterLabel, batchId],
    queryFn: async () => {
      let query = supabase
        .from('llm_scan_results')
        .select()
        .order('created_at', { ascending: false });

      if (filterType === "manual") {
        query = query.eq('scan_type', 'manual');
      } else if (filterType === "batch") {
        query = query.eq('scan_type', 'batch');
      }

      if (filterLabel) {
        query = query.eq('label', filterLabel);
      }

      if (batchId) {
        query = query.eq('batch_id', batchId);
      }

      const { data, error } = await query;
      if (error) {
        toast.error("Failed to fetch results: " + error.message);
        throw error;
      }
      return data as ScanResult[];
    },
  });

  const handleExport = () => {
    if (!results || results.length === 0) return;

    const csvData = results.map(result => ({
      prompt: result.prompt,
      result: result.result,
      provider: result.provider,
      model: result.model || '',
      scan_type: result.scan_type,
      batch_name: result.batch_name || '',
      label: result.label || '',
      created_at: new Date(result.created_at).toLocaleString(),
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `llm_scan_results_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Results exported successfully");
  };

  const handleAddLabel = async () => {
    if (!selectedResultId || !newLabel.trim()) return;

    const { error } = await supabase
      .from('llm_scan_results')
      .update({ label: newLabel.trim() })
      .eq('id', selectedResultId);

    if (error) {
      toast.error("Failed to add label: " + error.message);
      return;
    }

    toast.success("Label added successfully");
    setNewLabel("");
    setSelectedResultId(null);
  };

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-500">
          Failed to load results. Please try again.
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center">Loading results...</div>
      </Card>
    );
  }

  if (!results || results.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          {batchId 
            ? "No results found for this batch. The scan might still be in progress."
            : "No scan results available yet. Start a new scan from the LLM Scanner tab."}
        </div>
      </Card>
    );
  }

  const uniqueLabels = [...new Set(results.map(r => r.label).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-left">
            {batchId ? "Batch Scan Results" : "LLM Scan Results"}
          </h2>
          {batchId && (
            <div className="text-sm text-muted-foreground">
              Batch ID: {batchId}
            </div>
          )}
        </div>
        <div className="flex gap-4">
          {!batchId && (
            <div className="w-[200px]">
              <Label className="text-left">Filter by Type</Label>
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
          )}
          {uniqueLabels.length > 0 && (
            <div className="w-[200px]">
              <Label className="text-left">Filter by Label</Label>
              <Select value={filterLabel} onValueChange={setFilterLabel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select label" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Labels</SelectItem>
                  {uniqueLabels.map(label => (
                    <SelectItem key={label} value={label}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button onClick={handleExport} className="mt-auto">
            <Download className="w-4 h-4 mr-2" />
            Export Results
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {results?.map((result) => (
          <Card key={result.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <Badge variant={result.scan_type === 'manual' ? 'default' : 'secondary'}>
                    {result.scan_type === 'manual' ? 'Manual Prompt' : 'Batch Scan'}
                  </Badge>
                  {result.batch_name && (
                    <Badge variant="outline">{result.batch_name}</Badge>
                  )}
                  {result.label && (
                    <Badge variant="outline" className="bg-primary/10">
                      {result.label}
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(result.created_at).toLocaleString()}
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
                <Label className="text-left">Prompt</Label>
                <div className="mt-1 text-sm bg-muted p-3 rounded-md text-left">
                  {result.prompt}
                </div>
              </div>
              <div>
                <Label className="text-left">Result</Label>
                <div className="mt-1 text-sm bg-muted p-3 rounded-md whitespace-pre-wrap text-left">
                  {result.result}
                </div>
              </div>
              {!result.label && (
                <div className="flex gap-2 mt-4">
                  <Input
                    placeholder="Add a label"
                    value={selectedResultId === result.id ? newLabel : ''}
                    onChange={(e) => {
                      setNewLabel(e.target.value);
                      setSelectedResultId(result.id);
                    }}
                  />
                  <Button onClick={handleAddLabel}>Add Label</Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LLMResultsDashboard;