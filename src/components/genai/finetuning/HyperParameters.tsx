import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";

interface HyperParametersProps {
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
  };
  setHyperparameters: (value: any) => void;
}

export const HyperParameters = ({
  hyperparameters,
  setHyperparameters,
}: HyperParametersProps) => {
  const handleChange = (key: string, value: string | boolean) => {
    setHyperparameters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="hyperparameters">
        <AccordionTrigger>Advanced Training Parameters</AccordionTrigger>
        <AccordionContent>
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
                <Label>Gradient Clipping</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={hyperparameters.gradientClipping}
                  onChange={(e) => handleChange('gradientClipping', e.target.value)}
                  placeholder="e.g., 1.0"
                />
              </div>

              <div className="space-y-2">
                <Label>Validation Split</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={hyperparameters.validationSplit}
                  onChange={(e) => handleChange('validationSplit', e.target.value)}
                  placeholder="e.g., 0.2"
                />
              </div>

              <div className="space-y-2">
                <Label>Dropout Rate</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={hyperparameters.dropoutRate}
                  onChange={(e) => handleChange('dropoutRate', e.target.value)}
                  placeholder="e.g., 0.1"
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
                    <SelectItem value="adam">Adam</SelectItem>
                    <SelectItem value="adamw">AdamW</SelectItem>
                    <SelectItem value="sgd">SGD</SelectItem>
                    <SelectItem value="adafactor">Adafactor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Learning Rate Scheduler</Label>
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
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={hyperparameters.useEarlyStopping}
                onCheckedChange={(checked) => handleChange('useEarlyStopping', checked)}
              />
              <Label>Enable Early Stopping</Label>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};