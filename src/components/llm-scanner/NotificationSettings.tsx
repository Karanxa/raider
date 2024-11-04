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

interface NotificationSettings {
  notification_type: 'email' | 'slack';
  email_address?: string;
  slack_webhook_url?: string;
}

interface SupabaseNotificationSettings extends NotificationSettings {
  id: string;
  user_id: string;
  created_at: string;
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
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', session?.user?.id)
        .single();

      if (error) throw error;
      
      if (data) {
        const { notification_type, email_address, slack_webhook_url } = data as SupabaseNotificationSettings;
        setSettings({
          notification_type: notification_type as 'email' | 'slack',
          email_address,
          slack_webhook_url,
        });
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (type: 'email' | 'slack', value: string) => {
    try {
      const newSettings: NotificationSettings = {
        notification_type: type,
        ...(type === 'email' ? { email_address: value } : { slack_webhook_url: value }),
      };

      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: session?.user?.id,
          ...newSettings,
        });

      if (error) throw error;
      setSettings(newSettings);
      toast.success('Notification settings saved successfully');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast.error('Failed to save notification settings');
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Notification Type</Label>
        <Select
          value={settings?.notification_type || ""}
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
            onBlur={(e) => saveSettings('email', e.target.value)}
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
            onBlur={(e) => saveSettings('slack', e.target.value)}
          />
        </div>
      )}
    </div>
  );
};