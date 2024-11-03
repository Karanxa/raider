import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Dataset } from "./types";

interface DatasetCardProps {
  dataset: Dataset;
  onExport: (format: 'csv' | 'txt' | 'zip', dataset: Dataset) => void;
}

export const DatasetCard = ({ dataset, onExport }: DatasetCardProps) => {
  return (
    <Card key={dataset.id} className="p-4 space-y-4">
      <div>
        <h3 className="font-semibold">{dataset.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {dataset.description}
        </p>
      </div>
      <div className="flex items-center text-sm text-muted-foreground">
        <span>👥 {dataset.downloads} downloads</span>
        <span className="mx-2">•</span>
        <span>❤️ {dataset.likes} likes</span>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onExport('csv', dataset)}
        >
          <Download className="h-4 w-4 mr-1" />
          CSV
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onExport('txt', dataset)}
        >
          <Download className="h-4 w-4 mr-1" />
          TXT
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onExport('zip', dataset)}
        >
          <Download className="h-4 w-4 mr-1" />
          ZIP
        </Button>
      </div>
    </Card>
  );
};