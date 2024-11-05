import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ScriptDisplayProps {
  script: string | null;
}

export const ScriptDisplay = ({ script }: ScriptDisplayProps) => {
  if (!script) return null;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(script);
      toast.success("Script copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy script");
    }
  };

  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Generated Script</h3>
          <Button variant="outline" size="sm" onClick={copyToClipboard}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Script
          </Button>
        </div>
        <ScrollArea className="h-[400px] w-full rounded-md border">
          <pre className="p-4 text-sm">
            <code>{script}</code>
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};