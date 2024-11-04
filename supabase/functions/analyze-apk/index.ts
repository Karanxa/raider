import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as zip from "https://deno.land/x/zip@v1.2.3/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    
    // Download the APK file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('apk_files')
      .download(filePath);

    if (downloadError) throw downloadError;

    // Convert to ArrayBuffer
    const arrayBuffer = await fileData.arrayBuffer();
    
    // Create a temporary directory for extraction
    const tempDir = await Deno.makeTempDir();
    
    try {
      // Extract APK (it's a ZIP file)
      const reader = new zip.ZipReader(new Uint8Array(arrayBuffer));
      const entries = await reader.entries();
      
      let manifestContent = null;
      const resources = [];
      const dexFiles = [];
      const libraries = [];
      const assets = [];
      
      for (const entry of entries) {
        if (entry.filename === "AndroidManifest.xml") {
          const content = await entry.getData();
          manifestContent = content;
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

      // Parse manifest content (simplified for example)
      const manifest = {
        package: "com.example.app", // In reality, parse from binary XML
        versionCode: "1",
        versionName: "1.0",
        minSdkVersion: "21",
        targetSdkVersion: "33",
        permissions: ["android.permission.INTERNET"],
        activities: ["MainActivity"],
        services: [],
        receivers: []
      };

      // Update analysis record
      const { error: updateError } = await supabase
        .from('apk_analysis')
        .update({
          status: 'completed',
          package_name: manifest.package,
          version_name: manifest.versionName,
          version_code: manifest.versionCode,
          min_sdk_version: manifest.minSdkVersion,
          target_sdk_version: manifest.targetSdkVersion,
          permissions: manifest.permissions,
          activities: manifest.activities,
          services: manifest.services,
          receivers: manifest.receivers,
          manifest_content: {
            raw: manifestContent,
            parsed: manifest,
            resources,
            dexFiles,
            libraries,
            assets
          }
        })
        .eq('file_path', filePath);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } finally {
      // Cleanup
      await Deno.remove(tempDir, { recursive: true });
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});