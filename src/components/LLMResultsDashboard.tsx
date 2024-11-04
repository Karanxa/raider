import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { FilterBar } from "./llm-results/FilterBar";
import { ResultCard } from "./llm-results/ResultCard";
import { ScanResult } from "./llm-results/types";
import { ScrollArea } from "@/components/ui/scroll-area";

const LLMResultsDashboard = () => {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterLabel, setFilterLabel] = useState<string>("all_labels");
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

      if (filterLabel && filterLabel !== "all_labels") {
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
      <Card className="p-4 sm:p-6">
        <div className="text-center text-red-500">
          Failed to load results. Please try again.
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="text-center">Loading results...</div>
      </Card>
    );
  }

  if (!results || results.length === 0) {
    return (
      <Card className="p-4 sm:p-6">
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {batchId && (
          <div className="text-sm text-muted-foreground">
            Batch ID: {batchId}
          </div>
        )}
        <FilterBar
          filterType={filterType}
          filterLabel={filterLabel}
          onFilterTypeChange={setFilterType}
          onFilterLabelChange={setFilterLabel}
          uniqueLabels={uniqueLabels}
          results={results}
        />
      </div>

      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="space-y-4">
          {results.map((result) => (
            <ResultCard
              key={result.id}
              result={result}
              onLabelAdd={handleAddLabel}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default LLMResultsDashboard;
