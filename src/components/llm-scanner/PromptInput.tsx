import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useState } from "react";
import Papa from "papaparse";
import { toast } from "sonner";

interface PromptInputProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onPromptsFromCSV: (prompts: string[]) => void;
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
          .filter((row: any) => row.prompts)
          .map((row: any) => row.prompts.toString());

        if (prompts.length === 0) {
          toast.error("No valid prompts found in CSV file. Make sure you have a 'prompts' column.");
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
          CSV must have a "prompts" column
        </p>
      </div>
    </div>
  );
};