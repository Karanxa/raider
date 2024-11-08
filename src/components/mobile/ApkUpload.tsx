import { useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const ApkUpload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const session = useSession();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.apk')) {
      setSelectedFile(file);
    } else {
      toast.error("Please select a valid APK file");
      setSelectedFile(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id || !selectedFile) return;

    setIsUploading(true);

    try {
      // Upload file to storage
      const fileName = `${session.user.id}/${Date.now()}_${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('apk_files')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Trigger analysis
      const { error: analysisError } = await supabase.functions.invoke('security-scanner', {
        body: {
          operation: 'analyze-apk',
          fileName,
          userId: session.user.id
        }
      });

      if (analysisError) throw analysisError;

      toast.success("APK uploaded and analysis started");
      setSelectedFile(null);
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to upload and analyze APK");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">APK files only</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".apk"
                onChange={handleFileChange}
              />
            </label>
          </div>
          {selectedFile && (
            <div className="text-sm text-muted-foreground">
              Selected file: {selectedFile.name}
            </div>
          )}
          <Button 
            type="submit" 
            className="w-full"
            disabled={isUploading || !selectedFile}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading and Analyzing...
              </>
            ) : (
              'Upload and Analyze APK'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};