import { AlertCircle } from "lucide-react";

interface NotificationSettingsProps {
  scanning: boolean;
}

export const NotificationSettings = ({ scanning }: NotificationSettingsProps) => {
  return (
    <div className="flex items-center space-x-2">
      {scanning ? (
        <>
          <AlertCircle className="animate-spin h-5 w-5 text-red-500" />
          <span>Scanning in progress...</span>
        </>
      ) : (
        <span>No ongoing scans.</span>
      )}
    </div>
  );
};
