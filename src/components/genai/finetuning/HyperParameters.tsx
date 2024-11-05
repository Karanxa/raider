import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BasicParameters } from "./parameters/BasicParameters";
import { LoRAParameters } from "./parameters/LoRAParameters";
import { QLoRAParameters } from "./parameters/QLoRAParameters";
import { SFTParameters } from "./parameters/SFTParameters";

interface HyperParametersProps {
  hyperparameters: any;
  setHyperparameters: (value: any) => void;
}

export const HyperParameters = ({
  hyperparameters,
  setHyperparameters,
}: HyperParametersProps) => {
  const handleNestedChange = (category: string, key: string, value: string | boolean | string[]) => {
    setHyperparameters((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="hyperparameters">
        <AccordionTrigger>Training Parameters</AccordionTrigger>
        <AccordionContent>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Parameters</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Options</TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
              <BasicParameters
                hyperparameters={hyperparameters}
                setHyperparameters={setHyperparameters}
              />
            </TabsContent>

            <TabsContent value="advanced">
              <div className="space-y-6">
                {hyperparameters.finetuningType === 'lora' && (
                  <LoRAParameters
                    config={hyperparameters.loraConfig}
                    onChange={(key, value) => handleNestedChange('loraConfig', key, value)}
                  />
                )}

                {hyperparameters.finetuningType === 'qlora' && (
                  <QLoRAParameters
                    config={hyperparameters.qloraConfig}
                    onChange={(key, value) => handleNestedChange('qloraConfig', key, value)}
                  />
                )}

                {hyperparameters.finetuningType === 'sft' && (
                  <SFTParameters
                    config={hyperparameters.sftConfig}
                    onChange={(key, value) => handleNestedChange('sftConfig', key, value)}
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};