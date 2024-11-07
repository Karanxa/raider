import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useSession } from '@supabase/auth-helpers-react';
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface ReconResult {
  id: string;
  root_domain: string;
  live_subdomains: string[];
  js_files: string[];
  file_endpoints: string[];
  ok_endpoints: string[];
  scan_status: string;
  scan_timestamp: string;
}

const ReconResults = () => {
  const session = useSession();

  const { data: results, isLoading } = useQuery({
    queryKey: ['recon-results'],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      
      const { data, error } = await supabase
        .from('domain_recon_results')
        .select('*')
        .eq('user_id', session.user.id)
        .order('scan_timestamp', { ascending: false });

      if (error) throw error;
      return data as ReconResult[];
    },
    enabled: !!session?.user?.id
  });

  if (isLoading) {
    return <div>Loading results...</div>;
  }

  if (!results || results.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          No reconnaissance results available. Start a new scan from the Domain Recon tab.
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((result) => (
        <Card key={result.id} className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">{result.root_domain}</h3>
            <p className="text-sm text-gray-500">
              Scanned: {new Date(result.scan_timestamp).toLocaleString()}
            </p>
            <div className="mt-2">
              <span className={`inline-block px-2 py-1 text-xs rounded ${
                result.scan_status === 'completed' 
                  ? 'bg-green-100 text-green-800' 
                  : result.scan_status === 'running'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {result.scan_status.charAt(0).toUpperCase() + result.scan_status.slice(1)}
              </span>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="subdomains">
              <AccordionTrigger>
                Live Subdomains ({result.live_subdomains?.length || 0})
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {result.live_subdomains?.map((subdomain) => (
                    <div
                      key={subdomain}
                      className="p-2 bg-gray-50 rounded-md hover:bg-gray-100"
                    >
                      <a
                        href={subdomain}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {subdomain}
                      </a>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="js-files">
              <AccordionTrigger>
                JavaScript Files ({result.js_files?.length || 0})
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {result.js_files?.map((file) => (
                    <div
                      key={file}
                      className="p-2 bg-gray-50 rounded-md hover:bg-gray-100"
                    >
                      <a
                        href={file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {file}
                      </a>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="file-endpoints">
              <AccordionTrigger>
                File Endpoints ({result.file_endpoints?.length || 0})
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {result.file_endpoints?.map((endpoint) => (
                    <div
                      key={endpoint}
                      className="p-2 bg-gray-50 rounded-md hover:bg-gray-100"
                    >
                      <a
                        href={endpoint}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {endpoint}
                      </a>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="ok-endpoints">
              <AccordionTrigger>
                Live Endpoints ({result.ok_endpoints?.length || 0})
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {result.ok_endpoints?.map((endpoint) => (
                    <div
                      key={endpoint}
                      className="p-2 bg-gray-50 rounded-md hover:bg-gray-100"
                    >
                      <a
                        href={endpoint}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {endpoint}
                      </a>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      ))}
    </div>
  );
};

export default ReconResults;