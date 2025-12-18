import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find and update expired quotes
    const now = new Date().toISOString();
    
    const { data: expiredQuotes, error: selectError } = await supabase
      .from('quotes')
      .select('id')
      .eq('status', 'pending')
      .lt('expires_at', now);

    if (selectError) {
      console.error('Error selecting expired quotes:', selectError);
      throw selectError;
    }

    if (!expiredQuotes || expiredQuotes.length === 0) {
      console.log('No expired quotes found');
      return new Response(
        JSON.stringify({ message: 'No expired quotes found', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const expiredIds = expiredQuotes.map(q => q.id);
    
    const { error: updateError } = await supabase
      .from('quotes')
      .update({ status: 'expired' })
      .in('id', expiredIds);

    if (updateError) {
      console.error('Error updating expired quotes:', updateError);
      throw updateError;
    }

    console.log(`Successfully expired ${expiredIds.length} quotes`);

    return new Response(
      JSON.stringify({ 
        message: 'Quotes expired successfully', 
        count: expiredIds.length,
        expiredIds 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in expire-quotes function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
