import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useSession } from '@supabase/auth-helpers-react';
import { supabase } from "@/integrations/supabase/client";
import { sendNotification } from "@/utils/notifications";

const DomainRecon = () => {
  const [domain, setDomain] = useState<string>("");
  const [scanning, setScanning] = useState<boolean>(false);
  const session = useSession();

  const handleScan = async () => {
    if (!session?.user?.id) {
      toast("Please log in to perform scans", {
        description: "Authentication required",
      });
      return;
    }

    setScanning(true);
    try {
      const { error } = await supabase.functions.invoke('domain-recon', {
        body: { domain, userId: session.user.id }
      });

      if (error) throw error;

      toast("Domain reconnaissance started successfully", {
        description: "You will be notified when the scan completes",
      });
      await sendNotification(session.user.id, "Your domain reconnaissance scan has started successfully!");
    } catch (error) {
      console.error('Domain recon error:', error);
      toast("Failed to start domain reconnaissance", {
        description: "Please try again later",
      });
    } finally {
      setScanning(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold">Domain Recon</h2>
      <p className="text-sm text-gray-500">
        Enter a domain to start the reconnaissance scan.
      </p>
      <Input
        type="text"
        placeholder="example.com"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        className="mt-4 mb-4"
      />
      <Button onClick={handleScan} disabled={scanning}>
        {scanning ? "Scanning..." : "Start Scan"}
      </Button>
    </Card>
  );
};

export default DomainRecon;