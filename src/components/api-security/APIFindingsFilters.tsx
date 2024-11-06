import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface APIFindingsFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedOwner: string;
  onOwnerChange: (value: string) => void;
  owners: string[];
}

export const APIFindingsFilters = ({
  searchTerm,
  onSearchChange,
  selectedOwner,
  onOwnerChange,
  owners,
}: APIFindingsFiltersProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label>Search</Label>
        <Input
          placeholder="Search by repository, API path, or description..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      <div>
        <Label>Repository Owner</Label>
        <Select value={selectedOwner} onValueChange={onOwnerChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select owner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Owners</SelectItem>
            {owners.map((owner) => (
              <SelectItem key={owner} value={owner || "unknown"}>
                {owner || "Unknown Owner"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};