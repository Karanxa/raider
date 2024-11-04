import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import FileViewer from "./FileViewer";

interface ApkComponentsProps {
  apk: any;
}

const ApkComponents = ({ apk }: ApkComponentsProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <Accordion type="single" collapsible>
          <AccordionItem value="activities">
            <AccordionTrigger>
              Activities ({apk.activities?.length || 0})
            </AccordionTrigger>
            <AccordionContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {apk.activities?.map((activity: string, index: number) => (
                    <div key={index} className="p-2 text-sm">
                      {activity}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="services">
            <AccordionTrigger>
              Services ({apk.services?.length || 0})
            </AccordionTrigger>
            <AccordionContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {apk.services?.map((service: string, index: number) => (
                    <div key={index} className="p-2 text-sm">
                      {service}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="receivers">
            <AccordionTrigger>
              Broadcast Receivers ({apk.receivers?.length || 0})
            </AccordionTrigger>
            <AccordionContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {apk.receivers?.map((receiver: string, index: number) => (
                    <div key={index} className="p-2 text-sm">
                      {receiver}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default ApkComponents;
