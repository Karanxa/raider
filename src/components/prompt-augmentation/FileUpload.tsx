import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import Papa from 'papaparse';
import { toast } from "sonner";

interface FileUploadProps {
  onFileUpload: (prompts: string[]) => void;
  isProcessing: boolean;
}

export const FileUpload = ({ onFileUpload, isProcessing }: FileUploadProps) => {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        // Extract prompts from the 'prompts' column
        const promptList = results.data
          .filter((row: any) => row.prompts) // Filter out rows without prompts
          .map((row: any) => row.prompts.toString()); // Convert to string to handle any data type

        if (promptList.length === 0) {
          toast.error("No valid prompts found in CSV file. Make sure you have a 'prompts' column.");
          return;
        }

        onFileUpload(promptList);
        toast.success(`Loaded ${promptList.length} prompts from CSV`);
      },
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.toLowerCase().trim(),
    });
  };

  return (
    <div>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
        id="csv-upload"
        disabled={isProcessing}
      />
      <Button
        variant="outline"
        onClick={() => document.getElementById("csv-upload")?.click()}
        disabled={isProcessing}
      >
        <Upload className="w-4 h-4 mr-2" />
        Upload CSV
      </Button>
      <p className="text-sm text-muted-foreground mt-2">
        Upload a CSV file with a 'prompts' column
      </p>
    </div>
  );
};