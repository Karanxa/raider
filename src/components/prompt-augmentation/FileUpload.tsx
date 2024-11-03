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
        const promptList = results.data
          .map((row: any) => row.prompts)
          .filter((prompt: any) => prompt && typeof prompt === "string");

        if (promptList.length === 0) {
          toast.error("No valid prompts found in CSV file");
          return;
        }

        onFileUpload(promptList);
        toast.success(`Loaded ${promptList.length} prompts from CSV`);
      },
      header: true,
      error: (error) => {
        toast.error(`Error parsing CSV: ${error.message}`);
      },
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
    </div>
  );
};