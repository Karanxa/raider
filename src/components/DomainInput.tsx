import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Domain } from "@/types/domain";

interface DomainInputProps {
  onSubmit: (domain: Domain) => void;
}

const DomainInput = ({ onSubmit }: DomainInputProps) => {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const validateDomain = (domain: string) => {
    const pattern = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return pattern.test(domain);
  };

  const mockEnumeration = async (domain: string) => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    return {
      subdomains: [`api.${domain}`, `dev.${domain}`, `staging.${domain}`],
      jsFiles: [
        `https://${domain}/main.js`,
        `https://${domain}/vendor.js`,
      ],
      endpoints: [
        `https://${domain}/api/v1/users`,
        `https://${domain}/api/v1/products`,
      ],
    };
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

    setLoading(true);
    try {
      const results = await mockEnumeration(domain);
      onSubmit({
        rootDomain: domain,
        subdomains: results.subdomains,
        jsFiles: results.jsFiles,
        endpoints: results.endpoints,
        timestamp: new Date().toISOString(),
      });
      
      toast({
        title: "Success",
        description: "Domain reconnaissance completed successfully",
      });
      
      setDomain("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process domain",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2 text-left">
          <h2 className="text-xl font-semibold">Enter Root Domain</h2>
          <p className="text-sm text-gray-500">
            Enter a domain name (e.g., example.com) to start reconnaissance
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
            {loading ? "Processing..." : "Start Scan"}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default DomainInput;