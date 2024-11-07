import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { XSS_CATEGORIES } from "./constants";
import { XSSPayloadList } from "./XSSPayloadList";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Copy, Eraser, Wand2 } from "lucide-react";
import { toast } from "sonner";
import PayloadObfuscator from "./PayloadObfuscator";

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Category</Label>
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
          <div>
            <Label>Search</Label>
            <Input
              placeholder="Search payloads, descriptions, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {selectedPayloads.length > 0 && (
          <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
            <Button
              variant="secondary"
              size="sm"
              onClick={copySelectedPayloads}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Selected ({selectedPayloads.length})
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowObfuscator(true)}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Obfuscate Selected
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
            >
              <Eraser className="h-4 w-4 mr-2" />
              Clear Selection
            </Button>
          </div>
        )}

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