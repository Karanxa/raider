import { Progress } from "@/components/ui/progress";

interface ScanProgressProps {
  progress: number;
  timeRemaining: string | null;
  scannedRepos: number;
  totalRepos: number;
}

export const ScanProgress = ({ 
  progress, 
  timeRemaining, 
  scannedRepos, 
  totalRepos 
}: ScanProgressProps) => {
  return (
    <div className="space-y-2 mt-4">
      <div className="flex justify-between text-sm">
        <span>Scanning Progress</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="w-full" />
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>
          {scannedRepos} of {totalRepos} repositories scanned
        </span>
        {timeRemaining && (
          <span>Estimated time remaining: {timeRemaining}</span>
        )}
      </div>
    </div>
  );
};