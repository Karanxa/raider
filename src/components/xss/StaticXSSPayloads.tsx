import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { XSS_CATEGORIES } from "./constants";
import { XSSPayloadList } from "./XSSPayloadList";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const StaticXSSPayloads = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayload, setSelectedPayload] = useState<string>("");
  const [selectedPayloads, setSelectedPayloads] = useState<string[]>([]);

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

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Category</Label>
            <Select 
              value={selectedCategory} 
              onValueChange={setSelectedCategory}
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

        {isLoading ? (
          <div className="text-center py-8">Loading payloads...</div>
        ) : (
          <ScrollArea className="h-[600px]">
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
          </ScrollArea>
        )}
      </div>
    </Card>
  );
};

export default StaticXSSPayloads;