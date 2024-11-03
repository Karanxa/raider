import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from '@supabase/auth-helpers-react';
import { supabase } from "@/integrations/supabase/client";

const DomainRecon = () => {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const session = useSession();

  const validateDomain = (domain: string) => {
    const pattern = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return pattern.test(domain);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateDomain(domain)) {
      toast({
        title: "Invalid Domain",
        description: "Please enter a valid domain (e.g., example.com)",
        variant: "destructive",
      });
      return;
    }

    if (!session?.user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to perform reconnaissance",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('domain-recon', {
        body: { 
          domain,
          userId: session.user.id
        }
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Domain reconnaissance started successfully",
      });
      
      setDomain("");
    } catch (error) {
      console.error('Domain recon error:', error);
      toast({
        title: "Error",
        description: "Failed to start domain reconnaissance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Domain Reconnaissance</h2>
          <p className="text-sm text-gray-500">
            Enter a domain name to start reconnaissance and vulnerability scanning
          </p>
        </div>
        
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="example.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Processing..." : "Start Recon"}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default DomainRecon;