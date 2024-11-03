import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ApiKeyInputProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  onRefresh: () => void;
}

export const ApiKeyInput = ({ apiKey, onApiKeyChange, onRefresh }: ApiKeyInputProps) => {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>HuggingFace API Key</Label>
          <Input
            type="password"
            placeholder="Enter your HuggingFace API key"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Your API key is stored locally in your browser
          </p>
        </div>
        {apiKey && (
          <Button onClick={onRefresh}>
            Refresh Datasets
          </Button>
        )}
      </div>
    </Card>
  );
};