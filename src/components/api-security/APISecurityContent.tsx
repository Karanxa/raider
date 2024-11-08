import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { scanApiEndpoint } from "@/utils/apiSecurityScanner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@supabase/auth-helpers-react";
import { toast } from "sonner";

interface APISecurityContentProps {
  finding: any;
}

export const APISecurityContent = ({ finding }: APISecurityContentProps) => {
  const session = useSession();
  const severityColors: Record<string, string> = {
    high: "destructive",
    medium: "warning",
    low: "secondary"
  };

  useEffect(() => {
    const scanAndUpdateIssues = async () => {
      if (!finding.api_security_issues?.length) {
        // Perform security scan
        const securityIssues = scanApiEndpoint(finding.api_path, finding.method);
        
        try {
          // Insert security issues into database
          const { error } = await supabase
            .from('api_security_issues')
            .insert(securityIssues.map(issue => ({
              finding_id: finding.id,
              user_id: session?.user?.id,
              ...issue
            })));

          if (error) throw error;
          
          toast.success('Security scan completed');
        } catch (error) {
          console.error('Error saving security issues:', error);
          toast.error('Failed to save security scan results');
        }
      }
    };

    scanAndUpdateIssues();
  }, [finding.id, finding.api_path, finding.method, session?.user?.id]);

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

  return (
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
        <div className="p-4">
          {generateApiContract(finding)}
        </div>
      </TabsContent>
    </Tabs>
  );
};
