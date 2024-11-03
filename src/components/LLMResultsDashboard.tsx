import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import Papa from 'papaparse';
import { FilterBar } from "./llm-results/FilterBar";
import { ResultCard } from "./llm-results/ResultCard";
import { ScanResult } from "./llm-results/types";

const LLMResultsDashboard = () => {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterLabel, setFilterLabel] = useState<string>("");
  const location = useLocation();
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

  const handleAddLabel = async (resultId: string, label: string) => {
    const { error } = await supabase
      .from('llm_scan_results')
      .update({ label })
      .eq('id', resultId);

    if (error) {
      toast.error("Failed to add label: " + error.message);
      return;
    }

    toast.success("Label added successfully");
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
        <FilterBar
          filterType={filterType}
          filterLabel={filterLabel}
          onFilterTypeChange={setFilterType}
          onFilterLabelChange={setFilterLabel}
          uniqueLabels={uniqueLabels}
          onExport={handleExport}
        />
      </div>

      <div className="grid gap-4">
        {results.map((result) => (
          <ResultCard
            key={result.id}
            result={result}
            onLabelAdd={handleAddLabel}
          />
        ))}
      </div>
    </div>
  );
};

export default LLMResultsDashboard;