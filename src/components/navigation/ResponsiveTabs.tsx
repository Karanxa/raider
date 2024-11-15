import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TabItem } from "./TabConfig";

interface ResponsiveTabsProps {
  tabs: TabItem[];
  value?: string;
}

export const ResponsiveTabs = ({ tabs, value }: ResponsiveTabsProps) => {
  return (
    <Tabs value={value} className="w-full">
      <ScrollArea className="w-full whitespace-nowrap rounded-md border">
        <div className="flex p-1">
          <TabsList className="inline-flex h-9 items-center justify-center rounded-none bg-transparent p-0">
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value}
                className="gap-2"
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <ScrollBar orientation="horizontal" className="h-2.5" />
      </ScrollArea>
    </Tabs>
  );
};