import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { XSS_CATEGORIES } from "./constants";
import { XSSPayloadList } from "./XSSPayloadList";
import PayloadObfuscator from "./PayloadObfuscator";

const XSSPayloads = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayload, setSelectedPayload] = useState<string>("");
  const [selectedPayloads, setSelectedPayloads] = useState<string[]>([]);
  const [showBulkObfuscator, setShowBulkObfuscator] = useState(false);

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
    if (selectedCategory === "all") {
      return searchTerm 
        ? payload.payload.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payload.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payload.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        : true;
    }
    
    const categoryMatches = payload.category.toLowerCase() === selectedCategory.toLowerCase();
    const searchMatches = !searchTerm || 
      payload.payload.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payload.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payload.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return categoryMatches && searchMatches;
  });

  const handlePayloadSelect = (payload: string) => {
    setSelectedPayload(payload === selectedPayload ? "" : payload);
    setShowBulkObfuscator(false);
  };

  const handleCheckboxChange = (payload: string) => {
    setSelectedPayloads(prev => {
      if (prev.includes(payload)) {
        return prev.filter(p => p !== payload);
      } else {
        return [...prev, payload];
      }
    });
  };

  const handleSelectAllInCategory = (category: string) => {
    const categoryPayloads = payloads?.filter(p => 
      category === "all" ? true : p.category.toLowerCase() === category.toLowerCase()
    ).map(p => p.payload) || [];

    setSelectedPayloads(prev => {
      const allSelected = categoryPayloads.every(p => prev.includes(p));
      if (allSelected) {
        return prev.filter(p => !categoryPayloads.includes(p));
      } else {
        const newSelection = [...prev];
        categoryPayloads.forEach(p => {
          if (!newSelection.includes(p)) {
            newSelection.push(p);
          }
        });
        return newSelection;
      }
    });
  };

  const copySelectedPayloads = async () => {
    try {
      await navigator.clipboard.writeText(selectedPayloads.join('\n'));
      toast.success("Selected payloads copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy payloads");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-1/3">
          <Select 
            value={selectedCategory} 
            onValueChange={(value) => {
              setSelectedCategory(value);
              setSearchTerm("");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {XSS_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category.toLowerCase()}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-2/3">
          <Input
            placeholder="Search payloads, descriptions, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {selectedPayloads.length > 0 && (
        <div className="flex justify-between items-center bg-muted p-4 rounded-lg">
          <span>{selectedPayloads.length} payloads selected</span>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={copySelectedPayloads}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Selected
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowBulkObfuscator(prev => !prev)}
            >
              Obfuscate Selected
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedPayloads([]);
                setShowBulkObfuscator(false);
              }}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {showBulkObfuscator && selectedPayloads.length > 0 && (
        <PayloadObfuscator originalPayload={selectedPayloads.join('\n')} />
      )}

      {isLoading ? (
        <div className="text-center py-8">Loading payloads...</div>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="grid gap-4">
            <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
              <Checkbox
                id="select-all"
                checked={filteredPayloads?.every(p => selectedPayloads.includes(p.payload))}
                onCheckedChange={() => handleSelectAllInCategory(selectedCategory)}
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
              onPayloadSelect={handlePayloadSelect}
              onCheckboxChange={handleCheckboxChange}
            />
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default XSSPayloads;