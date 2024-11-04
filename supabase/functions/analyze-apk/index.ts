import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import * as zip from "https://deno.land/x/zip@v1.2.5/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const parseManifest = (buffer: Uint8Array) => {
  const content = new TextDecoder().decode(buffer);
  const manifest: any = {};

  // Extract package name
  const packageMatch = content.match(/package="([^"]+)"/);
  manifest.package = packageMatch ? packageMatch[1] : null;

  // Extract version info
  const versionNameMatch = content.match(/android:versionName="([^"]+)"/);
  manifest.versionName = versionNameMatch ? versionNameMatch[1] : null;

  const versionCodeMatch = content.match(/android:versionCode="([^"]+)"/);
  manifest.versionCode = versionCodeMatch ? versionCodeMatch[1] : null;

  // Extract SDK versions
  const minSdkMatch = content.match(/android:minSdkVersion="([^"]+)"/);
  const targetSdkMatch = content.match(/android:targetSdkVersion="([^"]+)"/);
  manifest.usesSdk = {
    minSdkVersion: minSdkMatch ? minSdkMatch[1] : null,
    targetSdkVersion: targetSdkMatch ? targetSdkMatch[1] : null
  };

  // Extract permissions
  const permissions = content.match(/uses-permission[^>]+android:name="([^"]+)"/g);
  manifest.permissions = permissions 
    ? permissions.map(p => p.match(/android:name="([^"]+)"/)?.[1]).filter(Boolean)
    : [];

  // Extract components
  const activities = content.match(/activity[^>]+android:name="([^"]+)"/g);
  manifest.activities = activities 
    ? activities.map(a => a.match(/android:name="([^"]+)"/)?.[1]).filter(Boolean)
    : [];

  const services = content.match(/service[^>]+android:name="([^"]+)"/g);
  manifest.services = services 
    ? services.map(s => s.match(/android:name="([^"]+)"/)?.[1]).filter(Boolean)
    : [];

  const receivers = content.match(/receiver[^>]+android:name="([^"]+)"/g);
  manifest.receivers = receivers 
    ? receivers.map(r => r.match(/android:name="([^"]+)"/)?.[1]).filter(Boolean)
    : [];

  return manifest;
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
    
    // Download the file with explicit error handling
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('apk_files')
      .download(filePath);

    if (downloadError) {
      console.error('Download error:', downloadError);
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
          try {
            manifestContent = parseManifest(content);
            console.log('Parsed manifest:', manifestContent);
          } catch (e) {
            console.error('Error parsing manifest:', e);
            manifestContent = { error: 'Failed to parse manifest' };
          }
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

      console.log('Updating database with extracted information...');

      const { error: updateError } = await supabase
        .from('apk_analysis')
        .update({
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
        })
        .eq('file_path', filePath);

      if (updateError) {
        throw new Error(`Failed to update analysis results: ${updateError.message}`);
      }

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
    
    // Update the analysis record with error status
    try {
      const { filePath } = await req.json();
      if (filePath) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        await supabase
          .from('apk_analysis')
          .update({
            status: 'error',
            error_message: error.message
          })
          .eq('file_path', filePath);
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