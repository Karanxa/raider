import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface APIFilterBarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  piiFilter: "all" | "pii" | "non-pii";
  setPiiFilter: (value: "all" | "pii" | "non-pii") => void;
}

export const APIFilterBar = ({ 
  searchTerm, 
  setSearchTerm, 
  piiFilter, 
  setPiiFilter 
}: APIFilterBarProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Input
        placeholder="Search by API path, repository, or method..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-md"
      />
      <Select value={piiFilter} onValueChange={(value: "all" | "pii" | "non-pii") => setPiiFilter(value)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by PII" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All APIs</SelectItem>
          <SelectItem value="pii">PII APIs</SelectItem>
          <SelectItem value="non-pii">Non-PII APIs</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};