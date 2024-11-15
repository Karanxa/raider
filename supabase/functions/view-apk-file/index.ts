import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import * as zip from "https://deno.land/x/zip@v1.2.5/mod.ts";

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

    const { apkId, filePath, fileType } = await req.json();

    // Get APK file path from database
    const { data: apkData, error: apkError } = await supabase
      .from('apk_analysis')
      .select('file_path')
      .eq('id', apkId)
      .single();

    if (apkError) throw apkError;

    // Download APK file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('apk_files')
      .download(apkData.file_path);

    if (downloadError) throw downloadError;

    // Extract and read the requested file
    const arrayBuffer = await fileData.arrayBuffer();
    const reader = new zip.ZipReader(new Uint8Array(arrayBuffer));
    const entries = await reader.entries();
    
    let content = '';
    for (const entry of entries) {
      if (entry.filename === filePath) {
        const fileContent = await entry.getData();
        content = new TextDecoder().decode(fileContent);
        break;
      }
    }

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});