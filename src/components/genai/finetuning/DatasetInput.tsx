import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface DatasetInputProps {
  onFileSelect: (file: File | null) => void;
}

export const DatasetInput = ({
  onFileSelect,
}: DatasetInputProps) => {
  return (
    <div className="space-y-2">
      <Label>Upload Dataset</Label>
      <Input
        type="file"
        accept=".json,.jsonl,.csv,.txt"
        onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
        className="cursor-pointer"
      />
      <p className="text-sm text-muted-foreground">
        Supported formats: JSON, JSONL, CSV, TXT
      </p>
    </div>
  );
};