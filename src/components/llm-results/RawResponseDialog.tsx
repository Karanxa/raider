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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Raw API Response</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[500px] mt-4">
          <pre className="bg-muted p-4 rounded-md overflow-x-auto">
            {JSON.stringify(rawResponse, null, 2)}
          </pre>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};