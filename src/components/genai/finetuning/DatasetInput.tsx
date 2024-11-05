import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface DatasetInputProps {
  datasetDescription: string;
  setDatasetDescription: (value: string) => void;
  trainingExamples: string;
  setTrainingExamples: (value: string) => void;
}

export const DatasetInput = ({
  datasetDescription,
  setDatasetDescription,
  trainingExamples,
  setTrainingExamples,
}: DatasetInputProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Dataset Description</Label>
        <Textarea 
          placeholder="Describe your dataset and what you want the model to learn..."
          value={datasetDescription}
          onChange={(e) => setDatasetDescription(e.target.value)}
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <Label>Training Examples</Label>
        <Textarea 
          placeholder="Enter your training examples, one per line..."
          value={trainingExamples}
          onChange={(e) => setTrainingExamples(e.target.value)}
          className="min-h-[200px] font-mono"
        />
        <p className="text-sm text-muted-foreground">
          Examples count: {trainingExamples.split('\n').filter(line => line.trim()).length}
        </p>
      </div>
    </div>
  );
};