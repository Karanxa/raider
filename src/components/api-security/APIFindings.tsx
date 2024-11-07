import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { APIFilterBar } from "./components/APIFilterBar";
import { APIFindingsTable } from "./components/APIFindingsTable";

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
  const [findings, setFindings] = useState<APIFinding[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [piiFilter, setPiiFilter] = useState<"all" | "pii" | "non-pii">("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFindings = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          toast.error("Please sign in to view API findings");
          return;
        }

        setIsLoading(true);
        const { data, error } = await supabase
          .from('github_api_findings')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching findings:', error);
          toast.error('Failed to fetch API findings: ' + error.message);
          return;
        }

        setFindings(data || []);
        if (data?.length === 0) {
          toast.info('No API findings found. Try scanning some repositories first.');
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('An error occurred while fetching API findings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFindings();

    const channel = supabase
      .channel('github_api_findings_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'github_api_findings' 
        }, 
        () => {
          fetchFindings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: "bg-blue-500",
      POST: "bg-green-500",
      PUT: "bg-yellow-500",
      DELETE: "bg-red-500",
      PATCH: "bg-purple-500"
    };
    return colors[method] || "bg-gray-500";
  };

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

      <APIFilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        piiFilter={piiFilter}
        setPiiFilter={setPiiFilter}
      />

      {isLoading ? (
        <div className="text-center py-8">Loading findings...</div>
      ) : findings.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No API findings yet. Try scanning some repositories first.
        </div>
      ) : (
        <APIFindingsTable 
          findings={filteredFindings}
          getMethodColor={getMethodColor}
        />
      )}
    </div>
  );
};