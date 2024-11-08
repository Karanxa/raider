import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handlePromptAugmentation } from "./handlers/prompt-handler.ts";
import { handleCodeAnalysis } from "./handlers/code-handler.ts";
import { handleChatSupport } from "./handlers/chat-handler.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { operation, ...params } = await req.json();
    
    switch (operation) {
      case 'augment-prompts':
        return await handlePromptAugmentation(params);
      case 'analyze-code':
        return await handleCodeAnalysis(params);
      case 'chat-support':
        return await handleChatSupport(params);
      default:
        throw new Error('Invalid operation specified');
    }
  } catch (error) {
    console.error('Error in ai-operations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});