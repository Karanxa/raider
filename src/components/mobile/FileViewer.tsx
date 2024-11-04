import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FileViewerProps {
  apkId: string;
  filePath: string;
  fileType: string;
}

const FileViewer = ({ apkId, filePath, fileType }: FileViewerProps) => {
  const { data: fileContent, isLoading } = useQuery({
    queryKey: ['apk-file-content', apkId, filePath],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('view-apk-file', {
        body: { apkId, filePath, fileType }
      });
      if (error) throw error;
      return data.content;
    },
    enabled: !!apkId && !!filePath
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-mono">{filePath}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
          <pre className="text-sm font-mono whitespace-pre-wrap">
            {fileContent || 'No content available'}
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default FileViewer;