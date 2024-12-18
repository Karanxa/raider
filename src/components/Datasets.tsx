import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { DatasetCard } from "./datasets/DatasetCard";
import { useDatasetExport } from "./datasets/useDatasetExport";
import { Dataset } from "./datasets/types";
import { CategorySelect } from "./datasets/CategorySelect";
import { toast } from "sonner";
import { useApiKeys } from "@/hooks/useApiKeys";

const Datasets = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [customKeyword, setCustomKeyword] = useState("");
  const [useCustomKeyword, setUseCustomKeyword] = useState(false);
  const { exportData } = useDatasetExport();
  const { getApiKey } = useApiKeys();

  const { data: datasets, isLoading, error, refetch } = useQuery({
    queryKey: ["adversarial-datasets", useCustomKeyword ? customKeyword : selectedCategory],
    queryFn: async () => {
      const apiKey = getApiKey("huggingface");
      if (!apiKey) {
        throw new Error("Please add your HuggingFace API key in Settings");
      }

      const searchQuery = useCustomKeyword ? customKeyword : selectedCategory;
      if (!searchQuery) {
        throw new Error(useCustomKeyword 
          ? "Please enter search keywords" 
          : "Please select a category"
        );
      }
      
      try {
        const { data, error } = await supabase.functions.invoke('huggingface-datasets', {
          body: { 
            apiKey, 
            category: searchQuery
          }
        });
        
        if (error) throw error;
        if (!data?.data) throw new Error("No data received from API");
        
        return data.data as Dataset[];
      } catch (err) {
        console.error("Error fetching datasets:", err);
        throw new Error("Failed to fetch datasets. Please check your API key and try again.");
      }
    },
    enabled: Boolean(useCustomKeyword ? customKeyword : selectedCategory),
    retry: false
  });

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSearchTerm(""); // Reset search when category changes
    refetch();
  };

  const filteredDatasets = datasets?.filter(dataset => {
    const searchLower = searchTerm.toLowerCase().trim();
    if (!searchLower) return true;
    
    return (
      dataset?.name?.toLowerCase().includes(searchLower) ||
      dataset?.description?.toLowerCase().includes(searchLower)
    );
  }) ?? [];

  if (error) {
    toast.error(error.message || "Failed to load datasets. Please check your API key and try again.");
  }

  return (
    <div className="space-y-6">
      <CategorySelect
        value={selectedCategory}
        onValueChange={handleCategoryChange}
        customKeyword={customKeyword}
        onCustomKeywordChange={setCustomKeyword}
        useCustomKeyword={useCustomKeyword}
        onUseCustomKeywordChange={(value) => {
          setUseCustomKeyword(value);
          if (value) {
            setSelectedCategory("");
          } else {
            setCustomKeyword("");
          }
          setSearchTerm(""); // Reset search when switching modes
        }}
      />

      {(selectedCategory || (useCustomKeyword && customKeyword)) && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {useCustomKeyword 
                ? `Search Results - "${customKeyword}"`
                : `Adversarial Datasets - ${selectedCategory}`}
            </h2>
            <div className="relative w-[300px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search in results..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {isLoading ? (
            <Card className="p-6">
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading datasets...</span>
              </div>
            </Card>
          ) : error ? (
            <Card className="p-6">
              <div className="text-center text-red-500">
                {error.message || "Failed to load datasets. Please check your API key and try again."}
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredDatasets.map((dataset) => (
                <DatasetCard
                  key={dataset.id}
                  dataset={dataset}
                  onExport={exportData}
                />
              ))}
              {filteredDatasets.length === 0 && (
                <Card className="p-6 col-span-full">
                  <div className="text-center text-muted-foreground">
                    {searchTerm 
                      ? `No datasets found matching "${searchTerm}"`
                      : `No datasets found for ${useCustomKeyword ? 'these keywords' : 'this category'}.`
                    }
                  </div>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Datasets;