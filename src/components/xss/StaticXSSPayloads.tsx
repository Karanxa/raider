import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { XSSPayloadList } from "./XSSPayloadList";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import PayloadObfuscator from "./PayloadObfuscator";
import { SearchAndFilter } from "./components/SearchAndFilter";
import { SelectionActions } from "./components/SelectionActions";

const StaticXSSPayloads = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayload, setSelectedPayload] = useState<string>("");
  const [selectedPayloads, setSelectedPayloads] = useState<string[]>([]);
  const [showObfuscator, setShowObfuscator] = useState(false);

  const { data: payloads, isLoading } = useQuery({
    queryKey: ['xss-payloads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('xss_payloads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const filteredPayloads = payloads?.filter(payload => {
    const categoryMatches = selectedCategory === "all" || 
      payload.category.toLowerCase() === selectedCategory.toLowerCase();
    
    const searchMatches = !searchTerm || 
      payload.payload.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payload.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payload.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return categoryMatches && searchMatches;
  });

  const handleSelectAllInCategory = () => {
    const categoryPayloads = filteredPayloads?.map(p => p.payload) || [];
    const allSelected = categoryPayloads.every(p => selectedPayloads.includes(p));

    if (allSelected) {
      setSelectedPayloads(prev => prev.filter(p => !categoryPayloads.includes(p)));
    } else {
      setSelectedPayloads(prev => {
        const newSelection = [...prev];
        categoryPayloads.forEach(p => {
          if (!newSelection.includes(p)) {
            newSelection.push(p);
          }
        });
        return newSelection;
      });
    }
  };

  const copySelectedPayloads = async () => {
    try {
      await navigator.clipboard.writeText(selectedPayloads.join('\n'));
      toast.success("Selected payloads copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy payloads");
    }
  };

  const clearSelection = () => {
    setSelectedPayloads([]);
    setSelectedPayload("");
    setShowObfuscator(false);
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <SearchAndFilter
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        <SelectionActions
          selectedPayloads={selectedPayloads}
          onCopy={copySelectedPayloads}
          onObfuscate={() => setShowObfuscator(true)}
          onClear={clearSelection}
        />

        {showObfuscator && selectedPayloads.length > 0 && (
          <PayloadObfuscator originalPayload={selectedPayloads.join('\n')} />
        )}

        {isLoading ? (
          <div className="text-center py-8">Loading payloads...</div>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
                <Checkbox
                  id="select-all"
                  checked={filteredPayloads?.length > 0 && filteredPayloads?.every(p => selectedPayloads.includes(p.payload))}
                  onCheckedChange={handleSelectAllInCategory}
                />
                <label
                  htmlFor="select-all"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Select all {selectedCategory === "all" ? "payloads" : `in ${selectedCategory}`}
                </label>
              </div>

              <XSSPayloadList
                payloads={filteredPayloads}
                selectedPayload={selectedPayload}
                selectedPayloads={selectedPayloads}
                onPayloadSelect={(payload) => setSelectedPayload(payload === selectedPayload ? "" : payload)}
                onCheckboxChange={(payload) => {
                  setSelectedPayloads(prev => 
                    prev.includes(payload) 
                      ? prev.filter(p => p !== payload)
                      : [...prev, payload]
                  );
                }}
              />
            </div>
          </ScrollArea>
        )}
      </div>
    </Card>
  );
};

export default StaticXSSPayloads;