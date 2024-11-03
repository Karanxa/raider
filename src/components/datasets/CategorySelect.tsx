import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const CATEGORIES = [
  "Jail Breaking",
  "Prompt Injection",
  "Encoding Based",
  "Unsafe Prompts",
  "Uncensored Prompts",
  "Language Based Adversial Prompts",
  "Glitch Tokens",
  "LLM evasion",
  "Leaking System Prompts",
  "Insecure Output Handling"
] as const;

interface CategorySelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const CategorySelect = ({ value, onValueChange }: CategorySelectProps) => {
  return (
    <div className="space-y-2">
      <Label>Select Attack Category</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a category" />
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};