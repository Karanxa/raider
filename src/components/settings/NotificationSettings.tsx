import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@supabase/auth-helpers-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface NotificationSettings {
  notification_type: 'email' | 'slack';
  email_address?: string;
  slack_webhook_url?: string;
}

export const NotificationSettings = () => {
  const session = useSession();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      loadSettings();
    }
  }, [session?.user?.id]);

  const loadSettings = async () => {
    if (!session?.user?.id) return;

    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSettings({
          notification_type: data.notification_type as 'email' | 'slack',
          email_address: data.email_address || undefined,
          slack_webhook_url: data.slack_webhook_url || undefined,
        });
      } else {
        // Initialize with default settings if none exist
        setSettings({
          notification_type: 'email',
          email_address: '',
          slack_webhook_url: '',
        });
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
      toast.error('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings || !session?.user?.id) return;

    try {
      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: session.user.id,
          ...settings,
        });

      if (error) throw error;
      toast.success('Notification settings saved successfully');
      await loadSettings(); // Reload settings after save
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast.error('Failed to save notification settings');
    }
  };

  if (loading) {
    return <div className="p-4">Loading settings...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Configure how you want to receive notifications about your scans.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Notification Type</Label>
          <Select
            value={settings?.notification_type || "email"}
            onValueChange={(value: 'email' | 'slack') => {
              setSettings(prev => ({ ...prev, notification_type: value } as NotificationSettings));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select notification type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="slack">Slack</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {settings?.notification_type === 'email' && (
          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input
              type="email"
              placeholder="Enter your email address"
              value={settings.email_address || ''}
              onChange={(e) => {
                setSettings(prev => ({ ...prev, email_address: e.target.value } as NotificationSettings));
              }}
            />
          </div>
        )}

        {settings?.notification_type === 'slack' && (
          <div className="space-y-2">
            <Label>Slack Webhook URL</Label>
            <Input
              type="url"
              placeholder="Enter your Slack webhook URL"
              value={settings.slack_webhook_url || ''}
              onChange={(e) => {
                setSettings(prev => ({ ...prev, slack_webhook_url: e.target.value } as NotificationSettings));
              }}
            />
          </div>
        )}

        <Button 
          onClick={saveSettings}
          className="w-full"
        >
          Save Settings
        </Button>
      </div>
    </div>
  );
};