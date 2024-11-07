import { Domain } from "@/types/domain";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DomainDetailsProps {
  domain: Domain;
  onBack: () => void;
}

const DomainDetails = ({ domain, onBack }: DomainDetailsProps) => {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{domain.rootDomain} Details</h2>
        <Button variant="outline" onClick={onBack}>
          Back to Dashboard
        </Button>
      </div>
      
      <div className="space-y-4">
        <section>
          <h3 className="text-lg font-semibold mb-2">Subdomains</h3>
          {domain.subdomains.length > 0 ? (
            <ul className="list-disc pl-5">
              {domain.subdomains.map((subdomain, index) => (
                <li key={index} className="text-sm">{subdomain}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No subdomains discovered</p>
          )}
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">JS Files</h3>
          {domain.jsFiles.length > 0 ? (
            <ul className="list-disc pl-5">
              {domain.jsFiles.map((file, index) => (
                <li key={index} className="text-sm">{file}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No JS files found</p>
          )}
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">Endpoints</h3>
          {domain.endpoints.length > 0 ? (
            <ul className="list-disc pl-5">
              {domain.endpoints.map((endpoint, index) => (
                <li key={index} className="text-sm">{endpoint}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No endpoints identified</p>
          )}
        </section>

        <p className="text-xs text-gray-500 mt-4">
          Scanned: {new Date(domain.timestamp).toLocaleString()}
        </p>
      </div>
    </Card>
  );
};

export default DomainDetails;