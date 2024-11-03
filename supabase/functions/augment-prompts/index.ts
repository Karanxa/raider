import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "@/integrations/supabase/client";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompts, keyword } = await req.json();

    const augmentedPrompts = prompts.map((prompt: string) => {
      // Simple augmentation logic based on the keyword
      return `${prompt.replace("location", "delivery location, data, orderID")} (augmented with keyword: ${keyword})`;
    });

    // Save augmented prompts to the database
    const { error } = await supabase.from('prompt_augmentations').insert(
      augmentedPrompts.map(augmented_prompt => ({
        user_id: "user-id-placeholder", // Replace with actual user ID
        original_prompt: prompts,
        keyword,
        augmented_prompt,
      }))
    );

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, augmentedPrompts }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in augment-prompts function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});