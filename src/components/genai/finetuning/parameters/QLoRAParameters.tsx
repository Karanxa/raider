import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface QLoRAParametersProps {
  config: {
    bitsQuant: string;
    groupSize: string;
    doubleQuant: boolean;
    quantizationMethod: string;
    useNesterov: boolean;
    usePagedOptim: boolean;
    useFastTokenizer: boolean;
    blockSize: string;
    targetModules: string[];
    quantizedDataType: string;
  };
  onChange: (key: string, value: string | boolean | string[]) => void;
}

export const QLoRAParameters = ({ config, onChange }: QLoRAParametersProps) => {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">QLoRA Configuration</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Quantization Bits</Label>
          <Select 
            value={config.bitsQuant}
            onValueChange={(value) => onChange('bitsQuant', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select bits" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2-bit</SelectItem>
              <SelectItem value="3">3-bit</SelectItem>
              <SelectItem value="4">4-bit</SelectItem>
              <SelectItem value="8">8-bit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Group Size</Label>
          <Input
            type="number"
            value={config.groupSize}
            onChange={(e) => onChange('groupSize', e.target.value)}
            placeholder="e.g., 128"
          />
        </div>

        <div className="space-y-2">
          <Label>Block Size</Label>
          <Input
            type="number"
            value={config.blockSize}
            onChange={(e) => onChange('blockSize', e.target.value)}
            placeholder="e.g., 64"
          />
        </div>

        <div className="space-y-2">
          <Label>Quantization Method</Label>
          <Select 
            value={config.quantizationMethod}
            onValueChange={(value) => onChange('quantizationMethod', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="symmetric">Symmetric</SelectItem>
              <SelectItem value="asymmetric">Asymmetric</SelectItem>
              <SelectItem value="percentile">Percentile</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Quantized Data Type</Label>
          <Select 
            value={config.quantizedDataType}
            onValueChange={(value) => onChange('quantizedDataType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select data type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fp4">FP4</SelectItem>
              <SelectItem value="nf4">NF4</SelectItem>
              <SelectItem value="int4">INT4</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          <Switch
            checked={config.doubleQuant}
            onCheckedChange={(checked) => onChange('doubleQuant', checked)}
          />
          <Label>Enable Double Quantization</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={config.useNesterov}
            onCheckedChange={(checked) => onChange('useNesterov', checked)}
          />
          <Label>Use Nesterov</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={config.usePagedOptim}
            onCheckedChange={(checked) => onChange('usePagedOptim', checked)}
          />
          <Label>Use Paged Optimizer</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={config.useFastTokenizer}
            onCheckedChange={(checked) => onChange('useFastTokenizer', checked)}
          />
          <Label>Use Fast Tokenizer</Label>
        </div>
      </div>
    </div>
  );
};