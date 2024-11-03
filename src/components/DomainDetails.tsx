import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Domain } from "@/types/domain";
import { ArrowLeft } from "lucide-react";

interface DomainDetailsProps {
  domain: Domain;
  onBack: () => void;
}

const DomainDetails = ({ domain, onBack }: DomainDetailsProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h2 className="text-2xl font-bold">{domain.rootDomain}</h2>
      </div>

      <Card className="p-6">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="subdomains">
            <AccordionTrigger>
              Subdomains ({domain.subdomains.length})
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {domain.subdomains.map((subdomain) => (
                  <div
                    key={subdomain}
                    className="p-2 bg-gray-50 rounded-md hover:bg-gray-100"
                  >
                    {subdomain}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="jsfiles">
            <AccordionTrigger>JS Files ({domain.jsFiles.length})</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {domain.jsFiles.map((file) => (
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

          <AccordionItem value="endpoints">
            <AccordionTrigger>
              Endpoints ({domain.endpoints.length})
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {domain.endpoints.map((endpoint) => (
                  <div
                    key={endpoint}
                    className="p-2 bg-gray-50 rounded-md hover:bg-gray-100"
                  >
                    {endpoint}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    </div>
  );
};

export default DomainDetails;