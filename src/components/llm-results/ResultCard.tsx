import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { ResultCardProps } from "./types";

export const ResultCard = ({ result, onLabelAdd }: ResultCardProps) => {
  const [newLabel, setNewLabel] = useState("");

  return (
    <Card key={result.id} className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <Badge variant={result.scan_type === 'manual' ? 'default' : 'secondary'}>
              {result.scan_type === 'manual' ? 'Manual Prompt' : 'Batch Scan'}
            </Badge>
            {result.batch_name && (
              <Badge variant="outline">{result.batch_name}</Badge>
            )}
            {result.label && (
              <Badge variant="outline" className="bg-primary/10">
                {result.label}
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {new Date(result.created_at).toLocaleString()}
          </div>
        </div>
        <div className="text-right">
          <Badge variant="outline">{result.provider}</Badge>
          {result.model && (
            <div className="text-sm text-muted-foreground mt-1">
              {result.model}
            </div>
          )}
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <Label className="text-left">Prompt</Label>
          <div className="mt-1 text-sm bg-muted p-3 rounded-md text-left">
            {result.prompt}
          </div>
        </div>
        <div>
          <Label className="text-left">Result</Label>
          <div className="mt-1 text-sm bg-muted p-3 rounded-md whitespace-pre-wrap text-left">
            {result.result}
          </div>
        </div>
        {!result.label && (
          <div className="flex gap-2 mt-4">
            <Input
              placeholder="Add a label"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
            />
            <Button onClick={() => {
              if (newLabel.trim()) {
                onLabelAdd(result.id, newLabel.trim());
                setNewLabel("");
              }
            }}>
              Add Label
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};