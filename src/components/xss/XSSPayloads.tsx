import { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ResponsiveTabs } from "@/components/navigation/ResponsiveTabs";
import StaticXSSPayloads from "./StaticXSSPayloads";
import DynamicXSSAnalysis from "./DynamicXSSAnalysis";
import { XSS_CATEGORIES } from "./constants";

const xssTabs = [
  { value: "static", label: "XSS Payloads", icon: null },
  { value: "dynamic", label: "Code Analysis", icon: null }
];

const XSSPayloads = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="static" className="w-full">
        <ResponsiveTabs tabs={xssTabs} />
        <div className="mt-4">
          <TabsContent value="static">
            <StaticXSSPayloads />
          </TabsContent>
          <TabsContent value="dynamic">
            <DynamicXSSAnalysis />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default XSSPayloads;