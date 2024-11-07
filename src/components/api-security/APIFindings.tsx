import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@supabase/auth-helpers-react";
import { useState } from "react";
import { ChevronDown, ChevronUp, Code } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  const generateApiContract = (finding: any) => {
    // Extract path parameters
    const pathParams = finding.api_path.match(/\{([^}]+)\}/g)?.map((param: string) => param.slice(1, -1)) || [];
    
    // Generate example response based on path structure
    const exampleResponse = {
      success: true,
      data: {
        id: "example-id",
        ...pathParams.reduce((acc: any, param: string) => ({
          ...acc,
          [param]: `example-${param}`
        }), {})
      }
    };

    return {
      endpoint: finding.api_path,
      method: finding.method,
      description: "API endpoint found in repository",
      parameters: {
        path: pathParams.map(param => ({
          name: param,
          type: "string",
          required: true,
          description: `${param} parameter`
        })),
        query: [],
        body: finding.method !== "GET" ? {
          type: "object",
          properties: {}
        } : undefined
      },
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer {token}"
      },
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              example: exampleResponse
            }
          }
        },
        400: {
          description: "Bad request",
          content: {
            "application/json": {
              example: {
                error: "Bad Request",
                message: "Invalid parameters"
              }
            }
          }
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              example: {
                error: "Unauthorized",
                message: "Authentication required"
              }
            }
          }
        }
      }
    };
  };

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
            <>
              <TableRow 
                key={finding.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => toggleRow(finding.id)}
              >
                <TableCell>
                  {expandedRows.includes(finding.id) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </TableCell>
                <TableCell>
                  {finding.repository_owner}/{finding.repository_name}
                </TableCell>
                <TableCell>
                  <a 
                    href={`${finding.repository_url}/blob/main/${finding.file_path}#L${finding.line_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {finding.api_path}
                  </a>
                </TableCell>
                <TableCell>
                  <Badge variant={methodColors[finding.method] as any || "secondary"}>
                    {finding.method}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {finding.file_path}:{finding.line_number}
                  </span>
                </TableCell>
                <TableCell>
                  {finding.api_security_issues?.length || 0} issues found
                </TableCell>
              </TableRow>
              {expandedRows.includes(finding.id) && (
                <TableRow>
                  <TableCell colSpan={6} className="bg-muted/30">
                    <Tabs defaultValue="issues" className="w-full">
                      <TabsList>
                        <TabsTrigger value="issues">Security Issues</TabsTrigger>
                        <TabsTrigger value="contract">API Contract</TabsTrigger>
                      </TabsList>
                      <TabsContent value="issues">
                        <div className="space-y-4 p-4">
                          {finding.api_security_issues?.map((issue: any, index: number) => (
                            <div key={index} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{issue.vulnerability_type}</span>
                                <Badge variant={severityColors[issue.severity.toLowerCase()] as any || "secondary"}>
                                  {issue.severity}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{issue.description}</p>
                              {issue.recommendation && (
                                <p className="text-sm text-muted-foreground">
                                  <span className="font-medium">Recommendation:</span> {issue.recommendation}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                      <TabsContent value="contract">
                        <div className="p-4 space-y-4">
                          <div className="bg-muted rounded-lg p-4">
                            <h3 className="text-lg font-semibold mb-4">API Contract</h3>
                            <div className="space-y-4">
                              {(() => {
                                const contract = generateApiContract(finding);
                                return (
                                  <>
                                    <div>
                                      <h4 className="font-medium mb-2">Endpoint</h4>
                                      <code className="bg-background px-2 py-1 rounded">{contract.endpoint}</code>
                                    </div>
                                    <div>
                                      <h4 className="font-medium mb-2">Parameters</h4>
                                      {contract.parameters.path.length > 0 ? (
                                        <div className="space-y-2">
                                          {contract.parameters.path.map((param: any, index: number) => (
                                            <div key={index} className="flex items-center gap-2">
                                              <Badge variant="outline">{param.name}</Badge>
                                              <span className="text-sm text-muted-foreground">{param.description}</span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-sm text-muted-foreground">No parameters required</p>
                                      )}
                                    </div>
                                    <div>
                                      <h4 className="font-medium mb-2">Headers</h4>
                                      <div className="space-y-2">
                                        {Object.entries(contract.headers).map(([key, value]) => (
                                          <div key={key} className="flex items-center gap-2">
                                            <Badge variant="outline">{key}</Badge>
                                            <span className="text-sm text-muted-foreground">{value}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-medium mb-2">Response Examples</h4>
                                      <div className="space-y-4">
                                        {Object.entries(contract.responses).map(([code, response]: [string, any]) => (
                                          <div key={code} className="space-y-2">
                                            <div className="flex items-center gap-2">
                                              <Badge>{code}</Badge>
                                              <span className="text-sm">{response.description}</span>
                                            </div>
                                            <pre className="bg-background p-2 rounded overflow-x-auto">
                                              <code>
                                                {JSON.stringify(response.content["application/json"].example, null, 2)}
                                              </code>
                                            </pre>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};