import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface DatasetInputProps {
  datasetType: string;
  setDatasetType: (value: string) => void;
  taskType: string;
  setTaskType: (value: string) => void;
  onFileSelect: (file: File | null) => void;
}

export const DatasetInput = ({
  datasetType,
  setDatasetType,
  taskType,
  setTaskType,
  onFileSelect,
}: DatasetInputProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label>Dataset Type</Label>
        <Select value={datasetType} onValueChange={setDatasetType}>
          <SelectTrigger>
            <SelectValue placeholder="Select dataset type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="code">Code</SelectItem>
            <SelectItem value="conversation">Conversation</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Task Type</Label>
        <Select value={taskType} onValueChange={setTaskType}>
          <SelectTrigger>
            <SelectValue placeholder="Select task type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="classification">Classification</SelectItem>
            <SelectItem value="generation">Generation</SelectItem>
            <SelectItem value="completion">Completion</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
    </div>
  );
};