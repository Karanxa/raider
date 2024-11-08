import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@supabase/auth-helpers-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APIFindingRow } from "./APIFindingRow";
import { APISecurityContent } from "./APISecurityContent";

export const APIFindings = () => {
  const session = useSession();
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const { data: findings, isLoading } = useQuery({
    queryKey: ['api-findings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('github_api_findings')
        .select(`
          *,
          api_security_issues (
            vulnerability_type,
            severity,
            description,
            recommendation
          )
        `)
        .eq('user_id', session?.user?.id);

      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id
  });

  const filteredFindings = findings?.filter(finding => {
    const matchesSearch = 
      finding.api_path.toLowerCase().includes(search.toLowerCase()) ||
      finding.repository_name.toLowerCase().includes(search.toLowerCase()) ||
      finding.method.toLowerCase().includes(search.toLowerCase());
    
    const matchesSeverity = severityFilter === "all" || 
      finding.api_security_issues?.some(issue => issue.severity.toLowerCase() === severityFilter.toLowerCase());
    
    const matchesMethod = methodFilter === "all" || 
      finding.method.toLowerCase() === methodFilter.toLowerCase();

    return matchesSearch && matchesSeverity && matchesMethod;
  });

  const toggleRow = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading findings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search APIs, repositories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="get">GET</SelectItem>
            <SelectItem value="post">POST</SelectItem>
            <SelectItem value="put">PUT</SelectItem>
            <SelectItem value="delete">DELETE</SelectItem>
            <SelectItem value="patch">PATCH</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30px]"></TableHead>
            <TableHead>Repository</TableHead>
            <TableHead>API Path</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>File Location</TableHead>
            <TableHead>Issues</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredFindings?.map((finding) => (
            <APIFindingRow
              key={finding.id}
              finding={finding}
              isExpanded={expandedRows.includes(finding.id)}
              onToggle={() => toggleRow(finding.id)}
              expandedContent={
                <APISecurityContent finding={finding} />
              }
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};