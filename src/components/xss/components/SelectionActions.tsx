import { Button } from "@/components/ui/button";
import { Copy, Eraser, Wand2 } from "lucide-react";
import { toast } from "sonner";

interface SelectionActionsProps {
  selectedPayloads: string[];
  onCopy: () => void;
  onObfuscate: () => void;
  onClear: () => void;
}

export const SelectionActions = ({
  selectedPayloads,
  onCopy,
  onObfuscate,
  onClear
}: SelectionActionsProps) => {
  if (selectedPayloads.length === 0) return null;

  return (
    <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
      <Button
        variant="secondary"
        size="sm"
        onClick={onCopy}
      >
        <Copy className="h-4 w-4 mr-2" />
        Copy Selected ({selectedPayloads.length})
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={onObfuscate}
      >
        <Wand2 className="h-4 w-4 mr-2" />
        Obfuscate Selected
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
      >
        <Eraser className="h-4 w-4 mr-2" />
        Clear Selection
      </Button>
    </div>
  );
};