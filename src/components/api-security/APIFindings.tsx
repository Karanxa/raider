import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@supabase/auth-helpers-react";

export const APIFindings = () => {
  const session = useSession();

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

  if (isLoading) {
    return <div>Loading findings...</div>;
  }

  return (
    <div className="space-y-4">
      {findings?.map((finding) => (
        <Card key={finding.id} className="p-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              {finding.repository_owner}/{finding.repository_name}
            </h3>
            <p>
              API Path: <a 
                href={`${finding.repository_url}/blob/main/${finding.file_path}#L${finding.line_number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {finding.api_path}
              </a>
            </p>
            <p>Method: {finding.method}</p>
            <p>File: {finding.file_path}</p>
            <p>Line: {finding.line_number}</p>
            {finding.api_security_issues?.map((issue, index) => (
              <div key={index} className="mt-4 p-4 bg-muted rounded-lg">
                <p className="font-semibold">{issue.vulnerability_type}</p>
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
  );
};