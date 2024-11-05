import { useState } from "react";
import { Button } from "@/components/ui/button";
import StaticXSSPayloads from "./StaticXSSPayloads";
import DynamicXSSAnalysis from "./DynamicXSSAnalysis";

const XSSPayloads = () => {
  const [showDynamicAnalysis, setShowDynamicAnalysis] = useState(false);

  return (
    <div className="space-y-6">
      {showDynamicAnalysis ? (
        <DynamicXSSAnalysis />
      ) : (
        <StaticXSSPayloads />
      )}
      
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => setShowDynamicAnalysis(!showDynamicAnalysis)}
        >
          {showDynamicAnalysis ? "View XSS Payloads" : "Analyze Code Snippet"}
        </Button>
      </div>
    </div>
  );
};

export default XSSPayloads;