import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Bug, AlertCircle } from "lucide-react";
import PayloadObfuscator from "./PayloadObfuscator";

interface XSSPayloadListProps {
  payloads: any[];
  selectedPayload: string;
  selectedPayloads: string[];
  onPayloadSelect: (payload: string) => void;
  onCheckboxChange: (payload: string) => void;
}

export const XSSPayloadList = ({
  payloads,
  selectedPayload,
  selectedPayloads,
  onPayloadSelect,
  onCheckboxChange
}: XSSPayloadListProps) => {
  return (
    <div className="grid gap-4">
      {payloads?.map((payload) => (
        <Card key={payload.id} className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedPayloads.includes(payload.payload)}
                onCheckedChange={() => onCheckboxChange(payload.payload)}
                className="mt-1"
              />
              {payload.category === 'WAF Bypass' ? (
                <Shield className="h-5 w-5 text-yellow-500" />
              ) : payload.category === 'CSP Bypass' ? (
                <Bug className="h-5 w-5 text-red-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-blue-500" />
              )}
              <span className="font-medium">{payload.category}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {payload.tags?.map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <div 
            className="bg-muted p-2 rounded-md font-mono text-sm mb-2 overflow-x-auto cursor-pointer hover:bg-muted/80"
            onClick={() => onPayloadSelect(payload.payload)}
          >
            {payload.payload}
          </div>
          {payload.description && (
            <p className="text-sm text-muted-foreground">{payload.description}</p>
          )}
          {selectedPayload === payload.payload && (
            <PayloadObfuscator originalPayload={payload.payload} />
          )}
        </Card>
      ))}
    </div>
  );
};