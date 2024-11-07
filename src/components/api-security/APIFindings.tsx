import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@supabase/auth-helpers-react";
import { useState } from "react";

export const APIFindings = () => {
  const session = useSession();
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");

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

  const severityColors: Record<string, string> = {
    high: "destructive",
    medium: "warning",
    low: "secondary"
  };

  const methodColors: Record<string, string> = {
    GET: "success",
    POST: "info",
    PUT: "warning",
    DELETE: "destructive",
    PATCH: "secondary"
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

      <div className="grid gap-6">
        {filteredFindings?.map((finding) => (
          <Card key={finding.id} className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {finding.repository_owner}/{finding.repository_name}
                </h3>
                <Badge variant={methodColors[finding.method] as any || "secondary"}>
                  {finding.method}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  API Path: <a 
                    href={`${finding.repository_url}/blob/main/${finding.file_path}#L${finding.line_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {finding.api_path}
                  </a>
                </p>
                <p className="text-sm text-muted-foreground">File: {finding.file_path}</p>
                <p className="text-sm text-muted-foreground">Line: {finding.line_number}</p>
              </div>

              {finding.api_security_issues?.map((issue, index) => (
                <div key={index} className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">{issue.vulnerability_type}</p>
                    <Badge variant={severityColors[issue.severity.toLowerCase()] as any || "secondary"}>
                      {issue.severity}
                    </Badge>
                  </div>
                  <p className="text-sm mt-1">{issue.description}</p>
                  {issue.recommendation && (
                    <p className="text-sm mt-2 text-muted-foreground">
                      Recommendation: {issue.recommendation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};