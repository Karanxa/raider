import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Code } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RawResponseDialogProps {
  rawResponse: any;
  responseStatus: number | null;
}

export const RawResponseDialog = ({ rawResponse, responseStatus }: RawResponseDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Code className="w-4 h-4" />
          Raw Response {responseStatus && `(${responseStatus})`}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Raw API Response</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="formatted" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="formatted">Formatted</TabsTrigger>
            <TabsTrigger value="raw">Raw</TabsTrigger>
          </TabsList>
          <TabsContent value="formatted">
            <ScrollArea className="h-[500px] w-full">
              <div className="p-4 space-y-4">
                {rawResponse && Object.entries(rawResponse).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <h3 className="font-medium text-sm text-muted-foreground">{key}</h3>
                    <pre className="bg-muted p-2 rounded-md overflow-x-auto">
                      {typeof value === 'object' 
                        ? JSON.stringify(value, null, 2)
                        : String(value)
                      }
                    </pre>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="raw">
            <ScrollArea className="h-[500px]">
              <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                {JSON.stringify(rawResponse, null, 2)}
              </pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};