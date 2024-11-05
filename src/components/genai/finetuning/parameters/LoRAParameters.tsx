import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface LoRAParametersProps {
  config: {
    rank: string;
    alpha: string;
    dropout: string;
    targetModules: string[];
    bias: string;
    scalingRank: string;
    moduleMapping: string;
    fanoutScaling: boolean;
    useReparameterization: boolean;
    rankPattern: string;
    alphaPattern: string;
    taskType: string;
  };
  onChange: (key: string, value: string | boolean | string[]) => void;
}

export const LoRAParameters = ({ config, onChange }: LoRAParametersProps) => {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">LoRA Configuration</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Rank</Label>
          <Input
            type="number"
            value={config.rank}
            onChange={(e) => onChange('rank', e.target.value)}
            placeholder="e.g., 8"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Alpha</Label>
          <Input
            type="number"
            value={config.alpha}
            onChange={(e) => onChange('alpha', e.target.value)}
            placeholder="e.g., 16"
          />
        </div>

        <div className="space-y-2">
          <Label>Dropout</Label>
          <Input
            type="number"
            step="0.1"
            value={config.dropout}
            onChange={(e) => onChange('dropout', e.target.value)}
            placeholder="e.g., 0.1"
          />
        </div>

        <div className="space-y-2">
          <Label>Scaling Rank</Label>
          <Input
            type="number"
            value={config.scalingRank}
            onChange={(e) => onChange('scalingRank', e.target.value)}
            placeholder="e.g., 4"
          />
        </div>

        <div className="space-y-2">
          <Label>Rank Pattern</Label>
          <Input
            value={config.rankPattern}
            onChange={(e) => onChange('rankPattern', e.target.value)}
            placeholder="e.g., 8,16,32"
          />
        </div>

        <div className="space-y-2">
          <Label>Alpha Pattern</Label>
          <Input
            value={config.alphaPattern}
            onChange={(e) => onChange('alphaPattern', e.target.value)}
            placeholder="e.g., 16,32,64"
          />
        </div>

        <div className="space-y-2">
          <Label>Task Type</Label>
          <Select 
            value={config.taskType} 
            onValueChange={(value) => onChange('taskType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select task type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="causal_lm">Causal LM</SelectItem>
              <SelectItem value="seq2seq">Sequence-to-Sequence</SelectItem>
              <SelectItem value="classification">Classification</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          <Switch
            checked={config.fanoutScaling}
            onCheckedChange={(checked) => onChange('fanoutScaling', checked)}
          />
          <Label>Enable Fan-out Scaling</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={config.useReparameterization}
            onCheckedChange={(checked) => onChange('useReparameterization', checked)}
          />
          <Label>Use Reparameterization</Label>
        </div>
      </div>
    </div>
  );
};