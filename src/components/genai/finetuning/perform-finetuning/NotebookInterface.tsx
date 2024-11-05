import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Play, Save, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";

interface NotebookInterfaceProps {
  script: string;
  onExecutionComplete: () => void;
}

export const NotebookInterface = ({ script, onExecutionComplete }: NotebookInterfaceProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const session = useSession();

  const executeCell = async () => {
    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('execute-colab-cell', {
        body: {
          script,
          userId: session?.user?.id
        }
      });

      if (error) throw error;

      setOutput(prev => [...prev, data.output]);
      toast.success("Cell executed successfully");
      onExecutionComplete();
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to execute cell");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Interactive Notebook</h3>
          <div className="space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={executeCell}
              disabled={isRunning}
            >
              {isRunning ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Run Cell
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-muted rounded-md p-4">
            <pre className="text-sm">
              <code>{script}</code>
            </pre>
          </div>

          {output.length > 0 && (
            <ScrollArea className="h-[300px] w-full rounded-md border">
              <div className="p-4 space-y-2">
                {output.map((out, index) => (
                  <div key={index} className="bg-background rounded-md p-2">
                    <pre className="text-sm whitespace-pre-wrap">
                      <code>{out}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
};