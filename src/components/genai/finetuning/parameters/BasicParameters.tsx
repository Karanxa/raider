import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface BasicParametersProps {
  hyperparameters: {
    learningRate: string;
    batchSize: string;
    epochs: string;
    warmupSteps: string;
    weightDecay: string;
    optimizerType: string;
    schedulerType: string;
    gradientClipping: string;
    useEarlyStopping: boolean;
    validationSplit: string;
    dropoutRate: string;
    seed: string;
    maxSteps: string;
    evaluationStrategy: string;
    evaluationSteps: string;
    loggingSteps: string;
    saveStrategy: string;
    saveSteps: string;
  };
  setHyperparameters: (value: any) => void;
}

export const BasicParameters = ({
  hyperparameters,
  setHyperparameters,
}: BasicParametersProps) => {
  const handleChange = (key: string, value: string | boolean) => {
    setHyperparameters((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Learning Rate</Label>
          <Input
            type="number"
            step="0.0001"
            value={hyperparameters.learningRate}
            onChange={(e) => handleChange('learningRate', e.target.value)}
            placeholder="e.g., 0.0001"
          />
        </div>

        <div className="space-y-2">
          <Label>Batch Size</Label>
          <Input
            type="number"
            value={hyperparameters.batchSize}
            onChange={(e) => handleChange('batchSize', e.target.value)}
            placeholder="e.g., 32"
          />
        </div>

        <div className="space-y-2">
          <Label>Epochs</Label>
          <Input
            type="number"
            value={hyperparameters.epochs}
            onChange={(e) => handleChange('epochs', e.target.value)}
            placeholder="e.g., 10"
          />
        </div>

        <div className="space-y-2">
          <Label>Max Steps</Label>
          <Input
            type="number"
            value={hyperparameters.maxSteps}
            onChange={(e) => handleChange('maxSteps', e.target.value)}
            placeholder="e.g., 1000"
          />
        </div>

        <div className="space-y-2">
          <Label>Warmup Steps</Label>
          <Input
            type="number"
            value={hyperparameters.warmupSteps}
            onChange={(e) => handleChange('warmupSteps', e.target.value)}
            placeholder="e.g., 500"
          />
        </div>

        <div className="space-y-2">
          <Label>Weight Decay</Label>
          <Input
            type="number"
            step="0.01"
            value={hyperparameters.weightDecay}
            onChange={(e) => handleChange('weightDecay', e.target.value)}
            placeholder="e.g., 0.01"
          />
        </div>

        <div className="space-y-2">
          <Label>Optimizer</Label>
          <Select 
            value={hyperparameters.optimizerType} 
            onValueChange={(value) => handleChange('optimizerType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select optimizer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="adamw">AdamW</SelectItem>
              <SelectItem value="adam">Adam</SelectItem>
              <SelectItem value="sgd">SGD</SelectItem>
              <SelectItem value="adafactor">Adafactor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Scheduler</Label>
          <Select 
            value={hyperparameters.schedulerType} 
            onValueChange={(value) => handleChange('schedulerType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select scheduler" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="linear">Linear</SelectItem>
              <SelectItem value="cosine">Cosine</SelectItem>
              <SelectItem value="constant">Constant</SelectItem>
              <SelectItem value="polynomial">Polynomial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Evaluation Strategy</Label>
          <Select 
            value={hyperparameters.evaluationStrategy} 
            onValueChange={(value) => handleChange('evaluationStrategy', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select strategy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="steps">Steps</SelectItem>
              <SelectItem value="epoch">Epoch</SelectItem>
              <SelectItem value="no">No Evaluation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Save Strategy</Label>
          <Select 
            value={hyperparameters.saveStrategy} 
            onValueChange={(value) => handleChange('saveStrategy', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select strategy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="steps">Steps</SelectItem>
              <SelectItem value="epoch">Epoch</SelectItem>
              <SelectItem value="no">No Saving</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Random Seed</Label>
          <Input
            type="number"
            value={hyperparameters.seed}
            onChange={(e) => handleChange('seed', e.target.value)}
            placeholder="e.g., 42"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={hyperparameters.useEarlyStopping}
          onCheckedChange={(checked) => handleChange('useEarlyStopping', checked)}
        />
        <Label>Enable Early Stopping</Label>
      </div>
    </div>
  );
};