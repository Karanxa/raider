import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const ADVERSARIAL_CATEGORIES = [
  "Prompt Injection",
  "Jailbreak Attempts",
  "Data Extraction",
  "Prompt Leaking",
  "System Prompt Inference",
  "Context Manipulation",
  "Token Manipulation",
  "Model Behavior Exploitation",
  "Output Manipulation",
  "Resource Exhaustion"
] as const;

interface CategorySelectProps {
  category: string;
  onCategoryChange: (value: string) => void;
}

export const CategorySelect = ({ category, onCategoryChange }: CategorySelectProps) => {
  return (
    <div className="space-y-2">
      <Label>Attack Category</Label>
      <Select value={category} onValueChange={onCategoryChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select attack category" />
        </SelectTrigger>
        <SelectContent>
          {ADVERSARIAL_CATEGORIES.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">
        Categorize your prompt based on the type of adversarial attack
      </p>
    </div>
  );
};