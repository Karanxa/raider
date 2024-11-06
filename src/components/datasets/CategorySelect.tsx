import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

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
  customKeyword: string;
  onCustomKeywordChange: (value: string) => void;
  useCustomKeyword: boolean;
  onUseCustomKeywordChange: (value: boolean) => void;
}

export const CategorySelect = ({ 
  value, 
  onValueChange, 
  customKeyword,
  onCustomKeywordChange,
  useCustomKeyword,
  onUseCustomKeywordChange,
}: CategorySelectProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch
          id="custom-search"
          checked={useCustomKeyword}
          onCheckedChange={onUseCustomKeywordChange}
        />
        <Label htmlFor="custom-search">Use custom search keywords</Label>
      </div>

      {useCustomKeyword ? (
        <div className="space-y-2">
          <Label>Custom Search Keywords</Label>
          <Input
            placeholder="Enter search keywords..."
            value={customKeyword}
            onChange={(e) => onCustomKeywordChange(e.target.value)}
          />
        </div>
      ) : (
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
      )}
    </div>
  );
};