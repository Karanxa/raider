import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

interface SFTParametersProps {
  config: {
    useDeepSpeed: boolean;
    gradientCheckpointing: boolean;
    mixedPrecision: string;
    useFlashAttention: boolean;
    useXformers: boolean;
    useTritonKernels: boolean;
    gradientAccumulationSteps: string;
    maxGradNorm: string;
    optimMemory: boolean;
    useActivationCheckpointing: boolean;
    useFsdp: boolean;
    useParallelTraining: boolean;
  };
  onChange: (key: string, value: string | boolean) => void;
}

export const SFTParameters = ({ config, onChange }: SFTParametersProps) => {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">SFT Configuration</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Mixed Precision</Label>
          <Select 
            value={config.mixedPrecision}
            onValueChange={(value) => onChange('mixedPrecision', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select precision" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="fp16">FP16</SelectItem>
              <SelectItem value="bf16">BF16</SelectItem>
              <SelectItem value="fp8">FP8</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Gradient Accumulation Steps</Label>
          <Input
            type="number"
            value={config.gradientAccumulationSteps}
            onChange={(e) => onChange('gradientAccumulationSteps', e.target.value)}
            placeholder="e.g., 4"
          />
        </div>

        <div className="space-y-2">
          <Label>Max Gradient Norm</Label>
          <Input
            type="number"
            value={config.maxGradNorm}
            onChange={(e) => onChange('maxGradNorm', e.target.value)}
            placeholder="e.g., 1.0"
          />
        </div>
      </div>

      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          <Switch
            checked={config.useDeepSpeed}
            onCheckedChange={(checked) => onChange('useDeepSpeed', checked)}
          />
          <Label>Use DeepSpeed</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={config.gradientCheckpointing}
            onCheckedChange={(checked) => onChange('gradientCheckpointing', checked)}
          />
          <Label>Enable Gradient Checkpointing</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={config.useFlashAttention}
            onCheckedChange={(checked) => onChange('useFlashAttention', checked)}
          />
          <Label>Use Flash Attention</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={config.useXformers}
            onCheckedChange={(checked) => onChange('useXformers', checked)}
          />
          <Label>Use xFormers Memory Efficient Attention</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={config.useTritonKernels}
            onCheckedChange={(checked) => onChange('useTritonKernels', checked)}
          />
          <Label>Use Triton Kernels</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={config.optimMemory}
            onCheckedChange={(checked) => onChange('optimMemory', checked)}
          />
          <Label>Optimize Memory Usage</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={config.useActivationCheckpointing}
            onCheckedChange={(checked) => onChange('useActivationCheckpointing', checked)}
          />
          <Label>Use Activation Checkpointing</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={config.useFsdp}
            onCheckedChange={(checked) => onChange('useFsdp', checked)}
          />
          <Label>Use Fully Sharded Data Parallel (FSDP)</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={config.useParallelTraining}
            onCheckedChange={(checked) => onChange('useParallelTraining', checked)}
          />
          <Label>Enable Parallel Training</Label>
        </div>
      </div>
    </div>
  );
};