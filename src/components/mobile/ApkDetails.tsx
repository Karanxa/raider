import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, Shield, Package, FileCode, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ApkOverview from "./ApkOverview";
import ApkComponents from "./ApkComponents";
import FileViewer from "./FileViewer";
import SecurityAnalysis from "./SecurityAnalysis";

interface ManifestContent {
  dexFiles?: string[];
  libraries?: string[];
  debuggable?: boolean;
  allowBackup?: boolean;
}

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

  const manifestContent = apk.manifest_content as ManifestContent;
  const permissions = Array.isArray(apk.permissions) ? apk.permissions : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">{apk.apk_name}</h1>
      </div>

      <ApkOverview apk={apk} onDownload={handleDownload} />

      <Tabs defaultValue="security">
        <TabsList>
          <TabsTrigger value="security">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Security Analysis
          </TabsTrigger>
          <TabsTrigger value="components">
            <Package className="h-4 w-4 mr-2" />
            Components
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Shield className="h-4 w-4 mr-2" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="source">
            <FileCode className="h-4 w-4 mr-2" />
            Source Files
          </TabsTrigger>
        </TabsList>

        <TabsContent value="security">
          <SecurityAnalysis apk={apk} />
        </TabsContent>

        <TabsContent value="components">
          <ApkComponents apk={apk} />
        </TabsContent>

        <TabsContent value="permissions">
          <div className="grid gap-4">
            {permissions.map((permission: string, index: number) => (
              <div
                key={index}
                className="p-3 bg-muted rounded-lg hover:bg-accent transition-colors"
              >
                {permission}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="source">
          <div className="grid gap-4">
            {manifestContent?.dexFiles?.map((file: string) => (
              <FileViewer 
                key={file}
                apkId={id!}
                filePath={file}
                fileType="dex"
              />
            ))}
            {manifestContent?.libraries?.map((lib: string) => (
              <FileViewer
                key={lib}
                apkId={id!}
                filePath={lib}
                fileType="library"
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApkDetails;