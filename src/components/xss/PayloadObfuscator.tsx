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
  const [obfuscatedPayload, setObfuscatedPayload] = useState<string>("");

  const handleEncode = () => {
    const encoded = encodePayload(originalPayload, encodingType);
    setObfuscatedPayload(encoded);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(obfuscatedPayload);
      toast.success("Payload copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy payload");
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
            Encode Payload
          </Button>
        </div>

        {obfuscatedPayload && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Obfuscated Payload</Label>
              <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
            <pre className="bg-muted p-2 rounded-md overflow-x-auto">
              <code>{obfuscatedPayload}</code>
            </pre>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PayloadObfuscator;