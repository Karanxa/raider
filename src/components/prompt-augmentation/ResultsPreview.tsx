import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import Papa from 'papaparse';

interface ResultsPreviewProps {
  augmentedPrompts: Array<{ original: string; augmented: string }>;
  onExport: () => void;
}

export const ResultsPreview = ({ augmentedPrompts, onExport }: ResultsPreviewProps) => {
  if (augmentedPrompts.length === 0) return null;

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-semibold">Preview of Augmented Prompts</h3>
          <p className="text-sm text-muted-foreground">
            Showing first 3 of {augmentedPrompts.length} prompts
          </p>
        </div>
        <Button onClick={onExport}>
          <Download className="w-4 h-4 mr-2" />
          Export All Results
        </Button>
      </div>
      <div className="space-y-4">
        {augmentedPrompts.slice(0, 3).map((item, index) => (
          <div key={index} className="space-y-2 pb-4 border-b last:border-0">
            <p className="text-sm text-muted-foreground">Original: {item.original}</p>
            <p className="text-sm">Augmented: {item.augmented}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};