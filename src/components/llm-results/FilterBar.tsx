import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Filter } from "lucide-react";
import { FilterProps } from "./types";
import { ExportDialog } from "./ExportDialog";

export const FilterBar = ({ 
  filterType, 
  filterLabel, 
  onFilterTypeChange, 
  onFilterLabelChange, 
  uniqueLabels,
  results
}: FilterProps & { results: any[] }) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="w-full sm:w-[200px]">
        <Label className="text-sm font-medium">Filter by Type</Label>
        <Select value={filterType} onValueChange={onFilterTypeChange}>
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder="Select filter type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                All Results
              </div>
            </SelectItem>
            <SelectItem value="manual">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Manual Prompts
              </div>
            </SelectItem>
            <SelectItem value="batch">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Batch Scans
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      {uniqueLabels.length > 0 && (
        <div className="w-full sm:w-[200px]">
          <Label className="text-sm font-medium">Filter by Label</Label>
          <Select value={filterLabel} onValueChange={onFilterLabelChange}>
            <SelectTrigger className="mt-1.5">
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
      <div className="sm:mt-auto">
        <ExportDialog results={results} />
      </div>
    </div>
  );
};