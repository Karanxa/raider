import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { EncodingType, encodePayload } from "@/utils/payloadEncoder";

interface PayloadObfuscatorProps {
  originalPayload: string;
}

const PayloadObfuscator = ({ originalPayload }: PayloadObfuscatorProps) => {
  const [encodingType, setEncodingType] = useState<EncodingType>("base64");
  const [obfuscatedPayloads, setObfuscatedPayloads] = useState<string[]>([]);

  const handleEncode = () => {
    // Split the input into individual payloads and encode each one
    const payloads = originalPayload.split('\n').filter(p => p.trim());
    const encoded = payloads.map(payload => encodePayload(payload, encodingType));
    setObfuscatedPayloads(encoded);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(obfuscatedPayloads.join('\n'));
      toast.success("Payloads copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy payloads");
    }
  };

  return (
    <Card className="p-4 mt-2">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-full max-w-xs">
            <Label>Encoding Type</Label>
            <Select value={encodingType} onValueChange={(value) => setEncodingType(value as EncodingType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select encoding" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="base64">Base64</SelectItem>
                <SelectItem value="url">URL Encode</SelectItem>
                <SelectItem value="html">HTML Entities</SelectItem>
                <SelectItem value="unicode">Unicode Escape</SelectItem>
                <SelectItem value="hex">Hex Escape</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="mt-6" onClick={handleEncode}>
            Encode Payload{obfuscatedPayloads.length > 1 ? 's' : ''}
          </Button>
        </div>

        {obfuscatedPayloads.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Obfuscated Payload{obfuscatedPayloads.length > 1 ? 's' : ''}</Label>
              <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
            <pre className="bg-muted p-2 rounded-md overflow-x-auto">
              <code>{obfuscatedPayloads.join('\n')}</code>
            </pre>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PayloadObfuscator;