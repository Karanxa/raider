import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@supabase/auth-helpers-react";
import { Card } from "@/components/ui/card";
import { APIFindingsFilters } from "./APIFindingsFilters";
import { APIFindingsTable } from "./APIFindingsTable";

export const APIFindings = () => {
  const session = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOwner, setSelectedOwner] = useState("");

  const { data: findings = [], isLoading } = useQuery({
    queryKey: ['api-findings', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      
      const { data, error } = await supabase
        .from('github_api_findings')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id
  });

  const owners = [...new Set(findings.map(f => f.repository_owner))].filter(Boolean);

  const filteredFindings = findings.filter(finding => {
    const matchesSearch = !searchTerm || 
      finding.repository_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      finding.api_path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      finding.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesOwner = !selectedOwner || finding.repository_owner === selectedOwner;

    return matchesSearch && matchesOwner;
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">API Findings</h2>
          <p className="text-muted-foreground">
            View and analyze API endpoints discovered in GitHub repositories
          </p>
        </div>

        <APIFindingsFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedOwner={selectedOwner}
          onOwnerChange={setSelectedOwner}
          owners={owners}
        />

        <APIFindingsTable findings={filteredFindings} />
      </div>
    </Card>
  );
};