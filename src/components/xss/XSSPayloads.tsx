import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Shield, Bug, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import PayloadObfuscator from "./PayloadObfuscator";

const XSSPayloads = () => {
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

  const { data: categories } = useQuery({
    queryKey: ['xss-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('xss_payloads')
        .select('category')
        .distinct();
      
      if (error) throw error;
      return data.map(item => item.category);
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
              {categories?.map((category) => (
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
          <Button 
            variant="outline" 
            onClick={() => setSelectedPayloads([])}
          >
            Clear Selection
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">Loading payloads...</div>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="grid gap-4">
            {selectedCategory !== "all" && (
              <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
                <Checkbox
                  id={`select-all-${selectedCategory}`}
                  checked={filteredPayloads?.every(p => selectedPayloads.includes(p.payload))}
                  onCheckedChange={() => handleSelectAllInCategory(selectedCategory)}
                />
                <label
                  htmlFor={`select-all-${selectedCategory}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Select all in {selectedCategory}
                </label>
              </div>
            )}
            
            {filteredPayloads?.map((payload) => (
              <Card key={payload.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedPayloads.includes(payload.payload)}
                      onCheckedChange={() => handleCheckboxChange(payload.payload)}
                      className="mt-1"
                    />
                    {payload.category === 'WAF Bypass' ? (
                      <Shield className="h-5 w-5 text-yellow-500" />
                    ) : payload.category === 'CSP Bypass' ? (
                      <Bug className="h-5 w-5 text-red-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-blue-500" />
                    )}
                    <span className="font-medium">{payload.category}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {payload.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div 
                  className="bg-muted p-2 rounded-md font-mono text-sm mb-2 overflow-x-auto cursor-pointer hover:bg-muted/80"
                  onClick={() => handlePayloadSelect(payload.payload)}
                >
                  {payload.payload}
                </div>
                {payload.description && (
                  <p className="text-sm text-muted-foreground">{payload.description}</p>
                )}
                {selectedPayload === payload.payload && (
                  <PayloadObfuscator originalPayload={payload.payload} />
                )}
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default XSSPayloads;