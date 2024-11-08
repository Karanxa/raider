import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
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

  const generateApiContract = () => {
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

    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">API Contract</h3>
          <div className="space-y-2">
            <p><span className="font-medium">Endpoint:</span> {finding.api_path}</p>
            <p><span className="font-medium">Method:</span> {finding.method}</p>
            <p><span className="font-medium">Description:</span> API endpoint found in repository</p>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Parameters</h4>
          <div className="space-y-2">
            {pathParams.length > 0 ? (
              pathParams.map(param => (
                <div key={param} className="pl-4">
                  <p><span className="font-medium">{param}</span> (path parameter)</p>
                  <p className="text-sm text-muted-foreground">Required</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No parameters required</p>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Example Response</h4>
          <pre className="bg-muted p-4 rounded-md overflow-x-auto">
            <code>{JSON.stringify(exampleResponse, null, 2)}</code>
          </pre>
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