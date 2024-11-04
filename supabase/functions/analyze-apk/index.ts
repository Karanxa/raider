import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import * as zip from "https://deno.land/x/zip@v1.2.5/mod.ts";
import { Buffer } from "https://deno.land/std@0.168.0/node/buffer.ts";
import { AndroidManifestParser } from "https://esm.sh/android-manifest-parser@0.1.7";

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
    console.log('Starting APK analysis for:', filePath);
    
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('apk_files')
      .download(filePath);

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw downloadError;
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
            const parser = new AndroidManifestParser();
            const parsedManifest = await parser.parse(Buffer.from(content));
            console.log('Raw parsed manifest:', parsedManifest);
            
            // Extract permissions with proper null checks
            const permissions = parsedManifest.usesPermissions?.map(p => 
              typeof p === 'string' ? p : p.name
            ) || [];

            // Extract components with proper null checks
            const activities = parsedManifest.application?.activities?.map(a => 
              typeof a === 'string' ? a : a.name
            ) || [];

            const services = parsedManifest.application?.services?.map(s => 
              typeof s === 'string' ? s : s.name
            ) || [];

            const receivers = parsedManifest.application?.receivers?.map(r => 
              typeof r === 'string' ? r : r.name
            ) || [];

            // Transform the manifest structure
            manifestContent = {
              package: parsedManifest.package || null,
              versionName: parsedManifest.versionName || null,
              versionCode: parsedManifest.versionCode || null,
              usesSdk: {
                minSdkVersion: parsedManifest.usesSdk?.minSdkVersion || null,
                targetSdkVersion: parsedManifest.usesSdk?.targetSdkVersion || null
              },
              permissions,
              activities,
              services,
              receivers
            };
            
            console.log('Transformed manifest:', JSON.stringify(manifestContent, null, 2));
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
        console.error('Update error:', updateError);
        throw updateError;
      }

      console.log('APK analysis completed successfully');

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
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});