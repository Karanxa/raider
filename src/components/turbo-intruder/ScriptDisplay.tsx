import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ScriptDisplayProps {
  script: string;
}

const ScriptDisplay = ({ script }: ScriptDisplayProps) => {
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(script);
      toast.success("Script copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy script");
    }
  };

  if (!script) return null;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-2">
          <div className="font-semibold">Generated Script</div>
          <Button variant="outline" size="sm" onClick={copyToClipboard}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
        </div>
        <pre className="bg-muted p-4 rounded-md overflow-x-auto">
          <code>{script}</code>
        </pre>
      </CardContent>
    </Card>
  );
};

export default ScriptDisplay;