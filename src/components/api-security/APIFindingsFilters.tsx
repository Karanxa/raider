import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface APIFindingsFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  piiFilter: "all" | "pii" | "non-pii";
  onPiiFilterChange: (value: "all" | "pii" | "non-pii") => void;
}

export const APIFindingsFilters = ({
  searchTerm,
  onSearchChange,
  piiFilter,
  onPiiFilterChange,
}: APIFindingsFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Input
        placeholder="Search by API path, repository, or method..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-md"
      />
      <Select value={piiFilter} onValueChange={onPiiFilterChange}>
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