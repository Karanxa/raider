import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from '@supabase/auth-helpers-react';

const ApkUpload = () => {
  const [uploading, setUploading] = useState(false);
  const session = useSession();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file || !session?.user?.id) {
        toast.error('Please select an APK file and ensure you are logged in');
        return;
      }

      if (!file.name.endsWith('.apk')) {
        toast.error('Please upload an APK file');
        return;
      }

      setUploading(true);
      
      // Create a unique filename to prevent collisions
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileName = `${timestamp}_${randomString}_${file.name}`;

      // Upload to Supabase Storage with explicit content type
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('apk_files')
        .upload(fileName, file, {
          contentType: 'application/vnd.android.package-archive',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      // Create analysis record
      const { error: dbError } = await supabase
        .from('apk_analysis')
        .insert({
          user_id: session.user.id,
          apk_name: file.name,
          file_path: fileName,
          status: 'pending'
        });

      if (dbError) {
        // If database insert fails, try to clean up the uploaded file
        await supabase.storage.from('apk_files').remove([fileName]);
        throw new Error(`Failed to create analysis record: ${dbError.message}`);
      }

      // Trigger analysis function
      const { error: analysisError } = await supabase.functions.invoke('analyze-apk', {
        body: { filePath: fileName }
      });

      if (analysisError) {
        throw new Error(`Failed to start analysis: ${analysisError.message}`);
      }

      toast.success('APK uploaded successfully and analysis started');
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload APK file');
    } finally {
      setUploading(false);
      if (event.target) {
        event.target.value = ''; // Reset file input
      }
    }
  };

  return (
    <Card className="p-6">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Upload APK</h2>
        <p className="text-muted-foreground">
          Upload an APK file to analyze its contents and structure
        </p>
        <div className="flex flex-col items-center gap-4">
          <input
            type="file"
            accept=".apk"
            onChange={handleFileUpload}
            className="hidden"
            id="apk-upload"
            disabled={uploading}
          />
          <Button
            onClick={() => document.getElementById('apk-upload')?.click()}
            disabled={uploading}
            className="w-full max-w-xs"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Select APK File
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ApkUpload;