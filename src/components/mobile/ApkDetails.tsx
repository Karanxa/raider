import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, Shield, Package, FileCode, Library, File } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const ApkDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: apk, isLoading } = useQuery({
    queryKey: ['apk-analysis', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apk_analysis')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    }
  });

  const handleDownload = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('apk_files')
        .createSignedUrl(apk.file_path, 60);

      if (error) throw error;
      
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      toast.error("Failed to download APK file");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!apk) {
    return <div>APK not found</div>;
  }

  const manifestContent = apk.manifest_content || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">{apk.apk_name}</h1>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-medium mb-2">Package Information</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-muted-foreground">Package Name</dt>
                    <dd>{apk.package_name || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Version</dt>
                    <dd>{apk.version_name} (code: {apk.version_code || 'N/A'})</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">SDK Version</dt>
                    <dd>Min: {apk.min_sdk_version || 'N/A'}, Target: {apk.target_sdk_version || 'N/A'}</dd>
                  </div>
                </dl>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleDownload}>
                  Download APK
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="permissions">
          <TabsList>
            <TabsTrigger value="permissions">
              <Shield className="h-4 w-4 mr-2" />
              Permissions
            </TabsTrigger>
            <TabsTrigger value="components">
              <Package className="h-4 w-4 mr-2" />
              Components
            </TabsTrigger>
            <TabsTrigger value="resources">
              <FileCode className="h-4 w-4 mr-2" />
              Resources
            </TabsTrigger>
          </TabsList>

          <TabsContent value="permissions" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {apk.permissions?.map((permission: string, index: number) => (
                      <div
                        key={index}
                        className="p-3 bg-muted rounded-lg hover:bg-accent transition-colors"
                      >
                        {permission}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="components" className="mt-4">
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
          </TabsContent>

          <TabsContent value="resources" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <Accordion type="single" collapsible>
                  <AccordionItem value="dex">
                    <AccordionTrigger>
                      <FileCode className="h-4 w-4 mr-2" />
                      DEX Files
                    </AccordionTrigger>
                    <AccordionContent>
                      <ScrollArea className="h-[200px]">
                        <div className="space-y-2">
                          {manifestContent.dexFiles?.map((file: string, index: number) => (
                            <div key={index} className="p-2 text-sm">
                              {file}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="libraries">
                    <AccordionTrigger>
                      <Library className="h-4 w-4 mr-2" />
                      Native Libraries
                    </AccordionTrigger>
                    <AccordionContent>
                      <ScrollArea className="h-[200px]">
                        <div className="space-y-2">
                          {manifestContent.libraries?.map((lib: string, index: number) => (
                            <div key={index} className="p-2 text-sm">
                              {lib}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="assets">
                    <AccordionTrigger>
                      <File className="h-4 w-4 mr-2" />
                      Assets
                    </AccordionTrigger>
                    <AccordionContent>
                      <ScrollArea className="h-[200px]">
                        <div className="space-y-2">
                          {manifestContent.assets?.map((asset: string, index: number) => (
                            <div key={index} className="p-2 text-sm">
                              {asset}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ApkDetails;