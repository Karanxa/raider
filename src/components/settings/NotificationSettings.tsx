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
  const [saving, setSaving] = useState(false);

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
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSettings({
          notification_type: data.notification_type as 'email' | 'slack',
          email_address: data.email_address || undefined,
          slack_webhook_url: data.slack_webhook_url || undefined,
        });
      } else {
        // Initialize with default email type if no settings exist
        setSettings({
          notification_type: 'email',
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
    if (!session?.user?.id || !settings) {
      toast.error('Please configure notification settings first');
      return;
    }

    setSaving(true);
    try {
      // Validate required fields based on notification type
      if (settings.notification_type === 'email' && !settings.email_address) {
        throw new Error('Email address is required');
      }
      if (settings.notification_type === 'slack' && !settings.slack_webhook_url) {
        throw new Error('Slack webhook URL is required');
      }

      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: session.user.id,
          ...settings,
        });

      if (error) throw error;
      toast.success('Notification settings saved successfully');
    } catch (error: any) {
      console.error('Error saving notification settings:', error);
      toast.error(error.message || 'Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading settings...</div>;
  }

  if (!session?.user?.id) {
    return <div className="p-4">Please log in to manage notification settings.</div>;
  }

  return (
    <div className="space-y-6">
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
              setSettings(prev => ({
                notification_type: value,
                email_address: value === 'email' ? prev?.email_address : undefined,
                slack_webhook_url: value === 'slack' ? prev?.slack_webhook_url : undefined,
              }));
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
                setSettings(prev => ({
                  ...prev!,
                  email_address: e.target.value,
                }));
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
                setSettings(prev => ({
                  ...prev!,
                  slack_webhook_url: e.target.value,
                }));
              }}
            />
          </div>
        )}

        <Button 
          onClick={saveSettings}
          className="w-full"
          disabled={saving || !settings}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};