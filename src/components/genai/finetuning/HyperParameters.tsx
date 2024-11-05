import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface HyperParametersProps {
  hyperparameters: {
    // Basic parameters
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
    // Advanced parameters
    finetuningType: string; // SFT, LoRA, QLoRA
    loraConfig: {
      rank: string;
      alpha: string;
      dropout: string;
      targetModules: string[];
    };
    qloraConfig: {
      bitsQuant: string;
      groupSize: string;
      doubleQuant: boolean;
    };
    sftConfig: {
      useDeepSpeed: boolean;
      gradientCheckpointing: boolean;
      mixedPrecision: string;
    };
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

  const handleNestedChange = (category: string, key: string, value: string | boolean) => {
    setHyperparameters(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="hyperparameters">
        <AccordionTrigger>Training Parameters</AccordionTrigger>
        <AccordionContent>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Parameters</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Options</TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
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
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={hyperparameters.useEarlyStopping}
                    onCheckedChange={(checked) => handleChange('useEarlyStopping', checked)}
                  />
                  <Label>Enable Early Stopping</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Fine-tuning Method</Label>
                  <Select 
                    value={hyperparameters.finetuningType} 
                    onValueChange={(value) => handleChange('finetuningType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sft">Supervised Fine-Tuning (SFT)</SelectItem>
                      <SelectItem value="lora">LoRA</SelectItem>
                      <SelectItem value="qlora">QLoRA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {hyperparameters.finetuningType === 'lora' && (
                  <div className="space-y-4">
                    <h4 className="font-medium">LoRA Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Rank</Label>
                        <Input
                          type="number"
                          value={hyperparameters.loraConfig.rank}
                          onChange={(e) => handleNestedChange('loraConfig', 'rank', e.target.value)}
                          placeholder="e.g., 8"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Alpha</Label>
                        <Input
                          type="number"
                          value={hyperparameters.loraConfig.alpha}
                          onChange={(e) => handleNestedChange('loraConfig', 'alpha', e.target.value)}
                          placeholder="e.g., 16"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Dropout</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={hyperparameters.loraConfig.dropout}
                          onChange={(e) => handleNestedChange('loraConfig', 'dropout', e.target.value)}
                          placeholder="e.g., 0.1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {hyperparameters.finetuningType === 'qlora' && (
                  <div className="space-y-4">
                    <h4 className="font-medium">QLoRA Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Quantization Bits</Label>
                        <Select 
                          value={hyperparameters.qloraConfig.bitsQuant}
                          onValueChange={(value) => handleNestedChange('qloraConfig', 'bitsQuant', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select bits" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="4">4-bit</SelectItem>
                            <SelectItem value="8">8-bit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Group Size</Label>
                        <Input
                          type="number"
                          value={hyperparameters.qloraConfig.groupSize}
                          onChange={(e) => handleNestedChange('qloraConfig', 'groupSize', e.target.value)}
                          placeholder="e.g., 128"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={hyperparameters.qloraConfig.doubleQuant}
                        onCheckedChange={(checked) => handleNestedChange('qloraConfig', 'doubleQuant', checked)}
                      />
                      <Label>Enable Double Quantization</Label>
                    </div>
                  </div>
                )}

                {hyperparameters.finetuningType === 'sft' && (
                  <div className="space-y-4">
                    <h4 className="font-medium">SFT Configuration</h4>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={hyperparameters.sftConfig.useDeepSpeed}
                          onCheckedChange={(checked) => handleNestedChange('sftConfig', 'useDeepSpeed', checked)}
                        />
                        <Label>Use DeepSpeed</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={hyperparameters.sftConfig.gradientCheckpointing}
                          onCheckedChange={(checked) => handleNestedChange('sftConfig', 'gradientCheckpointing', checked)}
                        />
                        <Label>Enable Gradient Checkpointing</Label>
                      </div>
                      <div className="space-y-2">
                        <Label>Mixed Precision</Label>
                        <Select 
                          value={hyperparameters.sftConfig.mixedPrecision}
                          onValueChange={(value) => handleNestedChange('sftConfig', 'mixedPrecision', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select precision" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no">No</SelectItem>
                            <SelectItem value="fp16">FP16</SelectItem>
                            <SelectItem value="bf16">BF16</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};