import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useState } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { ADVERSARIAL_CATEGORIES } from "./CategorySelect";

interface PromptWithCategory {
  prompt: string;
  category: string;
}

interface PromptInputProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onPromptsFromCSV: (prompts: PromptWithCategory[]) => void;
}

export const PromptInput = ({
  prompt,
  onPromptChange,
  onPromptsFromCSV,
}: PromptInputProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    Papa.parse(file, {
      complete: (results) => {
        const prompts = results.data
          .filter((row: any) => row.prompts && row.category)
          .map((row: any) => ({
            prompt: row.prompts.toString(),
            category: row.category.toString()
          }));

        if (prompts.length === 0) {
          toast.error("No valid prompts found in CSV file. Make sure you have 'prompts' and 'category' columns.");
          setIsUploading(false);
          return;
        }

        // Validate categories
        const invalidCategories = prompts.filter(
          p => !ADVERSARIAL_CATEGORIES.includes(p.category as any)
        );

        if (invalidCategories.length > 0) {
          toast.error("Some categories in the CSV are invalid. Please check the allowed categories.");
          setIsUploading(false);
          return;
        }

        onPromptsFromCSV(prompts);
        toast.success(`Loaded ${prompts.length} prompts from CSV`);
        setIsUploading(false);
      },
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.toLowerCase().trim(),
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Single Prompt</Label>
        <Textarea
          placeholder="Enter your prompt for scanning"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          className="min-h-[100px]"
        />
      </div>
      
      <div className="space-y-2">
        <Label>Or Upload CSV with Prompts</Label>
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
            disabled={isUploading}
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => document.getElementById("csv-upload")?.click()}
            disabled={isUploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? "Uploading..." : "Upload CSV"}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          CSV must have "prompts" and "category" columns. Valid categories: {ADVERSARIAL_CATEGORIES.join(", ")}
        </p>
      </div>
    </div>
  );
};