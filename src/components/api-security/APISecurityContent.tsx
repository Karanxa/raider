import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { scanApiEndpoint, analyzeCodeContext } from "@/utils/apiSecurityScanner";
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
        const securityIssues = scanApiEndpoint(finding.api_path, finding.method);
        
        try {
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

  const generateApiContract = () => {
    // Extract path parameters
    const pathParams = finding.api_path.match(/\{([^}]+)\}/g)?.map((param: string) => param.slice(1, -1)) || [];
    
    // Analyze code context to generate API contract
    const { parameters, requestBody, responses } = analyzeCodeContext(
      finding.file_path,
      finding.line_number,
      finding.file_content || ''
    );

    const contract = {
      endpoint: finding.api_path,
      method: finding.method,
      description: "API endpoint found in repository",
      parameters: {
        path: parameters.path,
        query: parameters.query,
        body: requestBody
      },
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer {token}"
      },
      responses
    };

    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">API Contract</h3>
          <div className="space-y-2">
            <p><span className="font-medium">Endpoint:</span> {contract.endpoint}</p>
            <p><span className="font-medium">Method:</span> {contract.method}</p>
            <p><span className="font-medium">Description:</span> {contract.description}</p>
          </div>
        </div>

        {Object.keys(contract.parameters.path).length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Path Parameters</h4>
            <div className="space-y-2">
              {Object.entries(contract.parameters.path).map(([param, config]: [string, any]) => (
                <div key={param} className="pl-4">
                  <p>
                    <span className="font-medium">{param}</span>
                    {config.required && <span className="text-destructive">*</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">Type: {config.type}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {contract.parameters.query.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Query Parameters</h4>
            <div className="space-y-2">
              {contract.parameters.query.map((param: any) => (
                <div key={param.name} className="pl-4">
                  <p><span className="font-medium">{param.name}</span></p>
                  <p className="text-sm text-muted-foreground">Type: {param.schema.type}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {Object.keys(contract.parameters.body?.properties || {}).length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Request Body</h4>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto">
              <code>{JSON.stringify(contract.parameters.body, null, 2)}</code>
            </pre>
          </div>
        )}

        <div>
          <h4 className="font-medium mb-2">Example Responses</h4>
          {Object.entries(contract.responses).map(([status, response]: [string, any]) => (
            <div key={status} className="mt-2">
              <p className="font-medium">Status {status}</p>
              <p className="text-sm text-muted-foreground">{response.description}</p>
              {response.content && (
                <pre className="bg-muted p-4 rounded-md overflow-x-auto mt-2">
                  <code>{JSON.stringify(response.content, null, 2)}</code>
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>
    );
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
        <Card>
          <CardContent className="pt-6">
            {generateApiContract()}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};