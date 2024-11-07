import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Domain } from "@/types/domain";
import DomainDetails from "./DomainDetails"; // Ensure this path is correct
import { supabase } from "@/integrations/supabase/client";
import { useSession } from '@supabase/auth-helpers-react';

interface DashboardProps {
  domains: Domain[];
}

const Dashboard = ({ domains }: DashboardProps) => {
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [scanning, setScanning] = useState(false);
  const session = useSession();

  const runNucleiScan = async (domain: Domain) => {
    if (!session?.user?.id) {
      toast.error('You must be logged in to run scans');
      return;
    }

    setScanning(true);
    try {
      const allDomains = [domain.rootDomain, ...domain.subdomains];
      
      const { data, error } = await supabase.functions.invoke('nuclei-scan', {
        body: { 
          domains: allDomains,
          userId: session.user.id
        }
      });

      if (error) throw error;
      
      toast.success(`Nuclei scan completed for ${domain.rootDomain}`);
    } catch (error) {
      console.error('Nuclei scan error:', error);
      toast.error(`Failed to run Nuclei scan: ${error.message}`);
    } finally {
      setScanning(false);
    }
  };

  if (domains.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <p>No domains scanned yet. Use the Domain Input tab to start scanning.</p>
        </div>
      </Card>
    );
  }

  if (selectedDomain) {
    return <DomainDetails domain={selectedDomain} onBack={() => setSelectedDomain(null)} />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {domains.map((domain) => (
        <Card
          key={domain.rootDomain + domain.timestamp}
          className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold mb-2">{domain.rootDomain}</h3>
          <div className="space-y-2 text-sm text-gray-500">
            <p>{domain.subdomains.length} subdomains discovered</p>
            <p>{domain.jsFiles.length} JS files found</p>
            <p>{domain.endpoints.length} endpoints identified</p>
            <p className="text-xs">
              Scanned: {new Date(domain.timestamp).toLocaleString()}
            </p>
          </div>
          <div className="mt-4 space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setSelectedDomain(domain)}
            >
              View Details
            </Button>
            <Button
              variant="secondary"
              onClick={() => runNucleiScan(domain)}
              disabled={scanning}
            >
              {scanning ? 'Running Nuclei...' : 'Run Nuclei Scan'}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default Dashboard;