export interface ScanResult {
  id: string;
  prompt: string;
  result: string;
  provider: string;
  model: string | null;
  scan_type: 'manual' | 'batch';
  batch_id: string | null;
  created_at: string;
  batch_name: string | null;
  label: string | null;
  response_status: number | null;
  raw_response: any;
}

export interface FilterProps {
  filterType: string;
  filterLabel: string;
  onFilterTypeChange: (value: string) => void;
  onFilterLabelChange: (value: string) => void;
  uniqueLabels: string[];
}

export interface ResultCardProps {
  result: ScanResult;
  onLabelAdd: (resultId: string, label: string) => void;
}