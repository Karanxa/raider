import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { XSS_CATEGORIES } from "../constants";

interface SearchAndFilterProps {
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

export const SearchAndFilter = ({
  selectedCategory,
  setSelectedCategory,
  searchTerm,
  setSearchTerm
}: SearchAndFilterProps) => {
  return (
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
  );
};