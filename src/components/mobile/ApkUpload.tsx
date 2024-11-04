import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from '@supabase/auth-helpers-react';

const ApkUpload = () => {
  const [uploading, setUploading] = useState(false);
  const session = useSession();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file || !session?.user?.id) return;

      if (!file.name.endsWith('.apk')) {
        toast.error('Please upload an APK file');
        return;
      }

      setUploading(true);
      
      // Upload to Supabase Storage
      const fileName = `${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('apk_files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create analysis record
      const { error: dbError } = await supabase
        .from('apk_analysis')
        .insert({
          user_id: session.user.id,
          apk_name: file.name,
          file_path: fileName,
          status: 'pending'
        });

      if (dbError) throw dbError;

      // Trigger analysis function
      const { error: analysisError } = await supabase.functions.invoke('analyze-apk', {
        body: { filePath: fileName }
      });

      if (analysisError) throw analysisError;

      toast.success('APK uploaded successfully and analysis started');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to upload APK file');
    } finally {
      setUploading(false);
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
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? 'Uploading...' : 'Select APK File'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ApkUpload;