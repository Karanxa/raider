import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { FilterProps } from "./types";

export const FilterBar = ({ 
  filterType, 
  filterLabel, 
  onFilterTypeChange, 
  onFilterLabelChange, 
  uniqueLabels,
  onExport 
}: FilterProps & { onExport: () => void }) => {
  return (
    <div className="flex gap-4">
      <div className="w-[200px]">
        <Label className="text-left">Filter by Type</Label>
        <Select value={filterType} onValueChange={onFilterTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select filter type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Results</SelectItem>
            <SelectItem value="manual">Manual Prompts</SelectItem>
            <SelectItem value="batch">Batch Scans</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {uniqueLabels.length > 0 && (
        <div className="w-[200px]">
          <Label className="text-left">Filter by Label</Label>
          <Select value={filterLabel} onValueChange={onFilterLabelChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select label" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Labels</SelectItem>
              {uniqueLabels.map(label => (
                <SelectItem key={label} value={label}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <Button onClick={onExport} className="mt-auto">
        <Download className="w-4 h-4 mr-2" />
        Export Results
      </Button>
    </div>
  );
};