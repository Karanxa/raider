import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { detectPIITypes } from "@/utils/piiPatterns";
import { toast } from "sonner";

interface APIFinding {
  id: string;
  repository_name: string;
  api_path: string;
  method: string;
  file_path: string;
  repository_url: string;
  pii_classification: boolean;
  pii_types: string[];
}

export const APIFindings = () => {
  const [findings, setFindings] = useState<APIFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPIIOnly, setShowPIIOnly] = useState(false);
  const session = useSession();

  const fetchFindings = async () => {
    try {
      const { data, error } = await supabase
        .from('github_api_findings')
        .select('*')
        .eq('user_id', session?.user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFindings(data || []);
    } catch (error) {
      console.error("Error fetching findings:", error);
      toast.error("Failed to fetch API findings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchFindings();
    }
  }, [session?.user?.id]);

  const filteredFindings = findings.filter(finding => {
    const matchesSearch = 
      finding.api_path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      finding.repository_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (showPIIOnly) {
      return matchesSearch && finding.pii_classification;
    }
    return matchesSearch;
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Input
          placeholder="Search APIs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <div className="flex items-center gap-2">
          <Checkbox
            id="pii-filter"
            checked={showPIIOnly}
            onCheckedChange={(checked) => setShowPIIOnly(checked as boolean)}
          />
          <label htmlFor="pii-filter" className="text-sm">
            Show PII handling APIs only
          </label>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredFindings.map((finding) => (
          <Card key={finding.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold mb-2">{finding.api_path}</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Repository: {finding.repository_name}</p>
                  <p>Method: {finding.method}</p>
                  <p>File: {finding.file_path}</p>
                </div>
              </div>
              <div className="space-y-2">
                {finding.pii_classification && (
                  <Badge variant="destructive">PII Data</Badge>
                )}
                {finding.pii_types?.map((type) => (
                  <Badge key={type} variant="outline" className="ml-2">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        ))}

        {filteredFindings.length === 0 && (
          <Card className="p-6 text-center text-muted-foreground">
            No API findings match your criteria
          </Card>
        )}
      </div>
    </div>
  );
};