import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ModelSelectProps {
  modelName: string;
  setModelName: (value: string) => void;
  datasetType: string;
  setDatasetType: (value: string) => void;
  taskType: string;
  setTaskType: (value: string) => void;
}

export const ModelSelect = ({
  modelName,
  setModelName,
  datasetType,
  setDatasetType,
  taskType,
  setTaskType,
}: ModelSelectProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label>Base Model</Label>
        <Select value={modelName || "select-model"} onValueChange={setModelName}>
          <SelectTrigger>
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="select-model">Select a model</SelectItem>
            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
            <SelectItem value="llama-2">LLaMA 2</SelectItem>
            <SelectItem value="mistral">Mistral</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Dataset Type</Label>
        <Select value={datasetType || "select-dataset"} onValueChange={setDatasetType}>
          <SelectTrigger>
            <SelectValue placeholder="Select dataset type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="select-dataset">Select dataset type</SelectItem>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="code">Code</SelectItem>
            <SelectItem value="conversation">Conversation</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Task Type</Label>
        <Select value={taskType || "select-task"} onValueChange={setTaskType}>
          <SelectTrigger>
            <SelectValue placeholder="Select task type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="select-task">Select task type</SelectItem>
            <SelectItem value="classification">Classification</SelectItem>
            <SelectItem value="generation">Generation</SelectItem>
            <SelectItem value="completion">Completion</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};