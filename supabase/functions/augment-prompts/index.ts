import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompts, keyword, userId } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Initialize Supabase client with environment variables
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const augmentedPrompts = prompts.map((prompt: string) => {
      let augmentedPrompt = prompt;

      // More sophisticated augmentation logic based on keyword
      if (keyword.toLowerCase() === 'ecommerce') {
        // Replace common generic terms with ecommerce-specific terms
        augmentedPrompt = augmentedPrompt
          .replace(/\blocation\b/gi, "delivery address")
          .replace(/\buser\b/gi, "customer")
          .replace(/\bdata\b/gi, "order data")
          .replace(/\bid\b/gi, "order ID")
          .replace(/\bpayment\b/gi, "payment method")
          .replace(/\bitem\b/gi, "product");
      }

      // Add context based on the keyword if not already present
      if (!augmentedPrompt.toLowerCase().includes(keyword.toLowerCase())) {
        augmentedPrompt = `${augmentedPrompt} in the context of ${keyword}`;
      }

      return augmentedPrompt;
    });

    // Save each augmented prompt individually
    const promises = augmentedPrompts.map((augmentedPrompt: string, index: number) => {
      return supabaseClient.from('prompt_augmentations').insert({
        user_id: userId,
        original_prompt: prompts[index],
        keyword,
        augmented_prompt: augmentedPrompt,
      });
    });

    await Promise.all(promises);

    return new Response(
      JSON.stringify({ success: true, augmentedPrompts }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in augment-prompts function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});