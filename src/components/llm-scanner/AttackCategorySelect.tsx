import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export const ATTACK_CATEGORIES = [
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

interface AttackCategorySelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const AttackCategorySelect = ({
  value,
  onValueChange,
}: AttackCategorySelectProps) => {
  return (
    <div className="space-y-2">
      <Label>Attack Category</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select an attack category" />
        </SelectTrigger>
        <SelectContent>
          {ATTACK_CATEGORIES.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};