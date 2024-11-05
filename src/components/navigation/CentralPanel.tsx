import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { categoryConfigs } from "./TabConfig";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ResponsiveTabs } from "./ResponsiveTabs";

export const CentralPanel = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { category, tab } = useParams();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    category || null
  );

  const handleCategorySelect = (categoryValue: string) => {
    setSelectedCategory(categoryValue);
    setIsSidebarOpen(true);
    navigate(`/${categoryValue}`);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const currentCategory = categoryConfigs.find(c => c.value === selectedCategory);

  if (!selectedCategory && location.pathname === '/') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {categoryConfigs.map((category) => (
          <Card
            key={category.value}
            className="p-6 cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            onClick={() => handleCategorySelect(category.value)}
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                {category.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{category.label}</h3>
                <p className="text-sm text-muted-foreground">
                  {category.tabs.length} tools available
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)]">
      <div
        className={cn(
          "h-full transition-all duration-300 ease-in-out border-r",
          isSidebarOpen ? "w-64" : "w-16"
        )}
      >
        <div className="flex items-center justify-between p-4">
          <h2 className={cn("font-semibold", !isSidebarOpen && "hidden")}>
            Navigation
          </h2>
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            {isSidebarOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="space-y-1 p-2">
          {categoryConfigs.map((category) => (
            <div key={category.value} className="space-y-1">
              <Button
                variant={selectedCategory === category.value ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  !isSidebarOpen && "justify-center p-2"
                )}
                onClick={() => handleCategorySelect(category.value)}
              >
                <div className="flex items-center gap-2">
                  {category.icon}
                  {isSidebarOpen && <span>{category.label}</span>}
                </div>
              </Button>
              {isSidebarOpen && selectedCategory === category.value && (
                <div className="ml-4 space-y-1">
                  {category.tabs.map((tab) => (
                    <Button
                      key={tab.value}
                      variant="ghost"
                      className="w-full justify-start text-sm"
                      onClick={() => navigate(`/${category.value}/${tab.value}`)}
                    >
                      {tab.icon}
                      <span className="ml-2">{tab.label}</span>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6">
        {currentCategory && !tab && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">{currentCategory.label}</h1>
            <p className="text-muted-foreground">
              Select a tool from the sidebar to get started with {currentCategory.label.toLowerCase()} security testing.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentCategory.tabs.map((tab) => (
                <Card
                  key={tab.value}
                  className="p-4 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => navigate(`/${currentCategory.value}/${tab.value}`)}
                >
                  <div className="flex items-center gap-2">
                    {tab.icon}
                    <span>{tab.label}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
        {tab && children}
      </div>
    </div>
  );
};