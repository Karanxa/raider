import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface HyperParametersProps {
  hyperparameters: {
    learningRate: string;
    batchSize: string;
    epochs: string;
  };
  setHyperparameters: (value: any) => void;
}

export const HyperParameters = ({
  hyperparameters,
  setHyperparameters,
}: HyperParametersProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label>Learning Rate</Label>
        <Input
          type="number"
          step="0.0001"
          value={hyperparameters.learningRate}
          onChange={(e) => setHyperparameters(prev => ({
            ...prev,
            learningRate: e.target.value
          }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Batch Size</Label>
        <Input
          type="number"
          value={hyperparameters.batchSize}
          onChange={(e) => setHyperparameters(prev => ({
            ...prev,
            batchSize: e.target.value
          }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Epochs</Label>
        <Input
          type="number"
          value={hyperparameters.epochs}
          onChange={(e) => setHyperparameters(prev => ({
            ...prev,
            epochs: e.target.value
          }))}
        />
      </div>
    </div>
  );
};