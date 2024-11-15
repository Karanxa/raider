import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import * as zip from "https://deno.land/x/zip@v1.2.5/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Utility functions to keep the main handler clean
const parseManifest = (buffer: Uint8Array) => {
  const content = new TextDecoder().decode(buffer);
  const manifest: any = {};

  // Extract basic info
  manifest.package = content.match(/package="([^"]+)"/)?.at(1) ?? null;
  manifest.versionName = content.match(/android:versionName="([^"]+)"/)?.at(1) ?? null;
  manifest.versionCode = content.match(/android:versionCode="([^"]+)"/)?.at(1) ?? null;
  
  // Extract SDK versions
  manifest.usesSdk = {
    minSdkVersion: content.match(/android:minSdkVersion="([^"]+)"/)?.at(1) ?? null,
    targetSdkVersion: content.match(/android:targetSdkVersion="([^"]+)"/)?.at(1) ?? null
  };

  // Extract components
  manifest.permissions = content.match(/uses-permission[^>]+android:name="([^"]+)"/g)
    ?.map(p => p.match(/android:name="([^"]+)"/)?.at(1))
    .filter(Boolean) ?? [];

  manifest.activities = content.match(/activity[^>]+android:name="([^"]+)"/g)
    ?.map(a => a.match(/android:name="([^"]+)"/)?.at(1))
    .filter(Boolean) ?? [];

  manifest.services = content.match(/service[^>]+android:name="([^"]+)"/g)
    ?.map(s => s.match(/android:name="([^"]+)"/)?.at(1))
    .filter(Boolean) ?? [];

  manifest.receivers = content.match(/receiver[^>]+android:name="([^"]+)"/g)
    ?.map(r => r.match(/android:name="([^"]+)"/)?.at(1))
    .filter(Boolean) ?? [];

  return manifest;
};

const updateAnalysisRecord = async (supabase: any, filePath: string, data: any) => {
  const { error } = await supabase
    .from('apk_analysis')
    .update(data)
    .eq('file_path', filePath);

  if (error) throw new Error(`Failed to update analysis results: ${error.message}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { filePath } = await req.json();
    if (!filePath) {
      throw new Error('No file path provided');
    }

    console.log('Starting APK analysis for:', filePath);
    
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('apk_files')
      .download(filePath);

    if (downloadError) {
      throw new Error(`Failed to download APK: ${downloadError.message}`);
    }

    if (!fileData) {
      throw new Error('No file data received');
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const tempDir = await Deno.makeTempDir();
    
    try {
      const reader = new zip.ZipReader(new Uint8Array(arrayBuffer));
      const entries = await reader.entries();
      
      let manifestContent = null;
      const resources: string[] = [];
      const dexFiles: string[] = [];
      const libraries: string[] = [];
      const assets: string[] = [];
      
      console.log('Extracting APK contents...');

      for (const entry of entries) {
        if (entry.filename === "AndroidManifest.xml") {
          const content = await entry.getData();
          manifestContent = parseManifest(content);
          console.log('Parsed manifest:', manifestContent);
        } else if (entry.filename.endsWith(".dex")) {
          dexFiles.push(entry.filename);
        } else if (entry.filename.startsWith("lib/")) {
          libraries.push(entry.filename);
        } else if (entry.filename.startsWith("assets/")) {
          assets.push(entry.filename);
        } else if (entry.filename.startsWith("res/")) {
          resources.push(entry.filename);
        }
      }

      await updateAnalysisRecord(supabase, filePath, {
        status: 'completed',
        package_name: manifestContent?.package || null,
        version_name: manifestContent?.versionName || null,
        version_code: manifestContent?.versionCode?.toString() || null,
        min_sdk_version: manifestContent?.usesSdk?.minSdkVersion?.toString() || null,
        target_sdk_version: manifestContent?.usesSdk?.targetSdkVersion?.toString() || null,
        permissions: manifestContent?.permissions || [],
        activities: manifestContent?.activities || [],
        services: manifestContent?.services || [],
        receivers: manifestContent?.receivers || [],
        manifest_content: {
          raw: manifestContent,
          resources,
          dexFiles,
          libraries,
          assets
        }
      });

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } finally {
      try {
        await Deno.remove(tempDir, { recursive: true });
      } catch (e) {
        console.error('Error cleaning up temp directory:', e);
      }
    }
  } catch (error) {
    console.error('Error:', error);
    
    try {
      const { filePath } = await req.json();
      if (filePath) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        await updateAnalysisRecord(supabase, filePath, {
          status: 'error',
          error_message: error.message
        });
      }
    } catch (e) {
      console.error('Failed to update error status:', e);
    }

    return new Response(
      JSON.stringify({ 
        error: 'Analysis failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
