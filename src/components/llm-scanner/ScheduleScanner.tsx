import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from '@supabase/auth-helpers-react';

interface ScheduleScannerProps {
  prompt: string;
  provider: string;
  model: string;
  customEndpoint: string;
  curlCommand: string;
  promptPlaceholder: string;
  customHeaders: string;
  apiKey: string;
}

export const ScheduleScanner = ({
  prompt,
  provider,
  model,
  customEndpoint,
  curlCommand,
  promptPlaceholder,
  customHeaders,
  apiKey,
}: ScheduleScannerProps) => {
  const [schedule, setSchedule] = useState<string>("");
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const session = useSession();

  const handleSchedule = async () => {
    if (!session?.user?.id) {
      toast.error("You must be logged in to schedule scans");
      return;
    }

    if (!schedule) {
      toast.error("Please enter a schedule");
      return;
    }

    if (!prompt) {
      toast.error("Please enter a prompt");
      return;
    }

    try {
      const { error } = await supabase.from('scheduled_llm_scans').insert({
        user_id: session.user.id,
        prompt,
        provider,
        model,
        custom_endpoint: customEndpoint,
        curl_command: curlCommand,
        prompt_placeholder: promptPlaceholder,
        custom_headers: customHeaders,
        api_key: apiKey,
        schedule,
        is_recurring: isRecurring,
        next_run: new Date(),
      });

      if (error) throw error;

      toast.success("Scan scheduled successfully");
    } catch (error) {
      console.error("Error scheduling scan:", error);
      toast.error("Failed to schedule scan");
    }
  };

  return (
    <Card className="p-4 mt-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Schedule (cron expression)</Label>
          <Input
            placeholder="*/5 * * * *"
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Enter a cron expression (e.g., "*/5 * * * *" for every 5 minutes)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="recurring"
            checked={isRecurring}
            onCheckedChange={setIsRecurring}
          />
          <Label htmlFor="recurring">Recurring scan</Label>
        </div>

        <Button onClick={handleSchedule} className="w-full">
          Schedule Scan
        </Button>
      </div>
    </Card>
  );
};