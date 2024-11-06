import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FindingsFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedOwner: string;
  onOwnerChange: (value: string) => void;
  owners: string[];
}

export const FindingsFilters = ({
  searchTerm,
  onSearchChange,
  selectedOwner,
  onOwnerChange,
  owners,
}: FindingsFiltersProps) => {
  return (
    <div className="flex gap-4 items-center">
      <Input
        placeholder="Search repositories..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-sm"
      />
      <Select value={selectedOwner} onValueChange={onOwnerChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Filter by owner" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">All owners</SelectItem>
          {owners.map((owner) => (
            <SelectItem 
              key={owner} 
              value={owner || "_unknown"}
            >
              {owner || "Unknown Owner"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};