import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { APIFindingsTable } from "./APIFindingsTable";
import { APIFindingsFilters } from "./APIFindingsFilters";
import { OWASPResults } from "@/components/security/OWASPResults";
import { Card } from "@/components/ui/card";
import { useSession } from '@supabase/auth-helpers-react';
import { useQuery } from "@tanstack/react-query";

interface APIFinding {
  id: string;
  repository_name: string;
  api_path: string;
  method: string;
  file_path: string;
  line_number: number;
  repository_url: string;
  pii_classification: boolean;
  pii_types: string[];
}

export const APIFindings = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [piiFilter, setPiiFilter] = useState<"all" | "pii" | "non-pii">("all");
  const [selectedApiPath, setSelectedApiPath] = useState<string | null>(null);
  const session = useSession();

  const { data: findings = [], isLoading } = useQuery({
    queryKey: ['github-api-findings', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];

      const { data, error } = await supabase
        .from('github_api_findings')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching findings:', error);
        toast.error('Failed to fetch API findings');
        return [];
      }

      return data as APIFinding[];
    },
    enabled: !!session?.user?.id
  });

  const filteredFindings = findings.filter(finding => {
    const matchesSearch = 
      finding.api_path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      finding.repository_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      finding.method.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPiiFilter = 
      piiFilter === "all" ? true :
      piiFilter === "pii" ? finding.pii_classification :
      !finding.pii_classification;

    return matchesSearch && matchesPiiFilter;
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">API Findings</h2>
        <p className="text-muted-foreground">
          Discovered API endpoints from your GitHub repositories.
        </p>
      </div>

      <APIFindingsFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        piiFilter={piiFilter}
        onPiiFilterChange={setPiiFilter}
      />

      <APIFindingsTable
        findings={filteredFindings}
        isLoading={isLoading}
        onScanComplete={(apiPath) => setSelectedApiPath(apiPath)}
      />

      {selectedApiPath && (
        <Card className="mt-6 p-6">
          <h3 className="text-lg font-semibold mb-4">Security Scan Results for {selectedApiPath}</h3>
          <OWASPResults targetUrl={selectedApiPath} />
        </Card>
      )}
    </div>
  );
};