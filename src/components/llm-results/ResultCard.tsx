import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { ResultCardProps } from "./types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RawResponseDialog } from "./RawResponseDialog";
import { 
  Beaker, 
  Calendar, 
  Tag, 
  Layers, 
  MessageSquare 
} from "lucide-react";

export const ResultCard = ({ result, onLabelAdd }: ResultCardProps) => {
  const [newLabel, setNewLabel] = useState("");

  return (
    <Card className="p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge 
              variant={result.scan_type === 'manual' ? 'default' : 'secondary'}
              className="flex items-center gap-1"
            >
              {result.scan_type === 'manual' ? (
                <MessageSquare className="w-3 h-3" />
              ) : (
                <Layers className="w-3 h-3" />
              )}
              {result.scan_type === 'manual' ? 'Manual Prompt' : 'Batch Scan'}
            </Badge>
            {result.batch_name && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {result.batch_name}
              </Badge>
            )}
            {result.label && (
              <Badge variant="outline" className="bg-primary/10 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {result.label}
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {new Date(result.created_at).toLocaleString()}
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Beaker className="w-3 h-3" />
            {result.provider}
          </Badge>
          {result.model && (
            <div className="text-sm text-muted-foreground">
              {result.model}
            </div>
          )}
          {(result.raw_response || result.response_status) && (
            <RawResponseDialog 
              rawResponse={result.raw_response} 
              responseStatus={result.response_status}
            />
          )}
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Prompt</Label>
          <ScrollArea className="h-[100px] mt-1.5">
            <div className="text-sm bg-muted/50 p-3 rounded-md">
              {result.prompt}
            </div>
          </ScrollArea>
        </div>
        <div>
          <Label className="text-sm font-medium">Result</Label>
          <ScrollArea className="h-[200px] mt-1.5">
            <div className="text-sm bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
              {result.result}
            </div>
          </ScrollArea>
        </div>
        {!result.label && (
          <div className="flex gap-2 mt-4">
            <Input
              placeholder="Add a label"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="max-w-[200px]"
            />
            <Button 
              variant="secondary"
              onClick={() => {
                if (newLabel.trim()) {
                  onLabelAdd(result.id, newLabel.trim());
                  setNewLabel("");
                }
              }}
            >
              Add Label
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};