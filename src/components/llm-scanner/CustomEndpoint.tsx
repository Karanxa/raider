import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CustomEndpointProps {
  customEndpoint: string;
  customHeaders: string;
  onEndpointChange: (value: string) => void;
  onHeadersChange: (value: string) => void;
}

export const CustomEndpoint = ({
  customEndpoint,
  customHeaders,
  onEndpointChange,
  onHeadersChange,
}: CustomEndpointProps) => {
  return (
    <>
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
    </>
  );
};