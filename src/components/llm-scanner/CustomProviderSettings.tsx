import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface CustomProviderSettingsProps {
  customEndpoint: string;
  customHeaders: string;
  curlCommand: string;
  promptPlaceholder: string;
  requiresApiKey: boolean;
  onEndpointChange: (value: string) => void;
  onHeadersChange: (value: string) => void;
  onCurlCommandChange: (value: string) => void;
  onPromptPlaceholderChange: (value: string) => void;
}

export const CustomProviderSettings = ({
  customEndpoint,
  customHeaders,
  curlCommand,
  promptPlaceholder,
  onEndpointChange,
  onHeadersChange,
  onCurlCommandChange,
  onPromptPlaceholderChange,
}: CustomProviderSettingsProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Custom Endpoint URL</Label>
        <Input
          type="url"
          placeholder="https://your-custom-endpoint.com"
          value={customEndpoint}
          onChange={(e) => onEndpointChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Custom Headers (Optional JSON)</Label>
        <Textarea
          placeholder='{"Authorization": "Bearer your-token"}'
          value={customHeaders}
          onChange={(e) => onHeadersChange(e.target.value)}
          className="font-mono text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label>cURL Command Template</Label>
        <Textarea
          placeholder={`curl -X POST "https://api.example.com/v1/chat" -H "Authorization: Bearer $API_KEY" -d "{\\"prompt\\": \\"{{PROMPT}}\\"}"'`}
          value={curlCommand}
          onChange={(e) => onCurlCommandChange(e.target.value)}
          className="font-mono text-sm min-h-[100px]"
        />
        <p className="text-sm text-muted-foreground">
          Use {`{{PROMPT}}`} as a placeholder where the prompt should be inserted
        </p>
      </div>

      <div className="space-y-2">
        <Label>Prompt Placeholder</Label>
        <Input
          type="text"
          placeholder="{{PROMPT}}"
          value={promptPlaceholder}
          onChange={(e) => onPromptPlaceholderChange(e.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          Specify the exact placeholder text used in your cURL command
        </p>
      </div>
    </div>
  );
};