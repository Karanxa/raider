import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportReport } from "./exportReport";

interface ExportButtonsProps {
  report: any;
}

export const ExportButtons = ({ report }: ExportButtonsProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => exportReport('doc', report)}
        className="flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        DOC
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => exportReport('pdf', report)}
        className="flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        PDF
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => exportReport('md', report)}
        className="flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        MD
      </Button>
    </div>
  );
};