import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from '@supabase/auth-helpers-react';
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { sendNotification } from "@/utils/notifications";

const NUCLEI_TEMPLATES = [
  'cves',
  'vulnerabilities',
  'misconfiguration',
  'exposed-panels',
  'exposures',
  'technologies'
];

const NucleiScanner = () => {
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [url, setUrl] = useState<string>("");
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const session = useSession();

  const { data: domains } = useQuery({
    queryKey: ['recon-domains'],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      
      const { data, error } = await supabase
        .from('domain_recon_results')
        .select('root_domain')
        .eq('user_id', session.user.id)
        .eq('scan_status', 'completed')
        .order('scan_timestamp', { ascending: false });

      if (error) throw error;
      return [...new Set(data.map(d => d.root_domain))];
    },
    enabled: !!session?.user?.id
  });

  const handleTemplateToggle = (template: string) => {
    setSelectedTemplates(prev =>
      prev.includes(template)
        ? prev.filter(t => t !== template)
        : [...prev, template]
    );
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to perform scans",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDomain && !url) {
      toast({
        title: "Input Required",
        description: "Please select a domain or enter a URL",
        variant: "destructive",
      });
      return;
    }

    if (selectedTemplates.length === 0) {
      toast({
        title: "Templates Required",
        description: "Please select at least one template",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('nuclei-scan', {
        body: { 
          domain: selectedDomain,
          url,
          userId: session.user.id,
          templates: selectedTemplates
        }
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Nuclei scan started successfully",
      });

      await sendNotification(session.user.id, "Your Nuclei scan has started successfully!");
      
      setUrl("");
      setSelectedDomain("");
      setSelectedTemplates([]);
    } catch (error) {
      console.error('Nuclei scan error:', error);
      toast({
        title: "Error",
        description: "Failed to start Nuclei scan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleScan} className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Nuclei Scanner</h2>
          <p className="text-sm text-gray-500">
            Select a reconned domain or enter a specific URL for vulnerability scanning
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Domain</Label>
            <Select
              value={selectedDomain}
              onValueChange={setSelectedDomain}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a domain" />
              </SelectTrigger>
              <SelectContent>
                {domains?.map((domain) => (
                  <SelectItem key={domain} value={domain}>
                    {domain}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Or Enter URL</Label>
            <Input
              type="text"
              placeholder="https://example.com/path"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Select Templates</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {NUCLEI_TEMPLATES.map((template) => (
                <div key={template} className="flex items-center space-x-2">
                  <Checkbox
                    id={template}
                    checked={selectedTemplates.includes(template)}
                    onCheckedChange={() => handleTemplateToggle(template)}
                  />
                  <Label htmlFor={template} className="capitalize">
                    {template.replace('-', ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Scanning..." : "Start Nuclei Scan"}
        </Button>
      </form>
    </Card>
  );
};

export default NucleiScanner;
