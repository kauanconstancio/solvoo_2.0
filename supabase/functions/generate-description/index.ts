import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limit configuration
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per window
const RATE_LIMIT_WINDOW_MINUTES = 1; // 1 minute window

const SYSTEM_PROMPT = `Você é um especialista em marketing e copywriting para serviços no Brasil. Sua tarefa é gerar descrições profissionais, atraentes e persuasivas para anúncios de serviços.

DIRETRIZES:
- Escreva em português brasileiro
- Use linguagem clara e profissional
- Destaque benefícios e diferenciais
- Inclua chamadas para ação sutis
- LIMITE: Máximo 500 caracteres (MUITO IMPORTANTE!)
- Use parágrafos curtos para facilitar leitura
- Mencione experiência e qualidade
- Não invente informações específicas (anos de experiência, certificações)
- Foque em gerar confiança e credibilidade

ESTRUTURA SUGERIDA (mantenha conciso):
1. Abertura atraente sobre o serviço
2. Principais benefícios
3. Fechamento com chamada para ação

Gere APENAS a descrição, sem títulos ou formatação especial. Máximo 500 caracteres.`;

// Get client IP from request headers
function getClientIdentifier(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  // Fallback to a hash of user agent + some headers
  const userAgent = req.headers.get('user-agent') || 'unknown';
  return `ua:${userAgent.substring(0, 50)}`;
}

// Check rate limit using database function
async function checkRateLimit(
  supabase: any,
  identifier: string,
  functionName: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_function_name: functionName,
      p_max_requests: RATE_LIMIT_MAX_REQUESTS,
      p_window_minutes: RATE_LIMIT_WINDOW_MINUTES,
    });

    if (error) {
      console.error('Rate limit check error:', error);
      // On error, allow the request (fail open)
      return true;
    }

    return data === true;
  } catch (err) {
    console.error('Rate limit exception:', err);
    return true;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client for rate limiting
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check rate limit
    const clientId = getClientIdentifier(req);
    const isAllowed = await checkRateLimit(supabase, clientId, 'generate-description');

    if (!isAllowed) {
      console.log(`Rate limit exceeded for: ${clientId}`);
      return new Response(JSON.stringify({ 
        error: 'Limite de requisições excedido. Aguarde um minuto e tente novamente.' 
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': '60'
        },
      });
    }

    const { title, category, subcategory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!title || !category) {
      return new Response(JSON.stringify({ error: 'Título e categoria são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userPrompt = `Gere uma descrição profissional para o seguinte serviço:

Título: ${title}
Categoria: ${category}${subcategory ? `\nSubcategoria: ${subcategory}` : ''}

A descrição deve ser convincente, destacar os benefícios do serviço e gerar confiança no potencial cliente.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Muitas requisições. Tente novamente em alguns segundos.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Limite de uso atingido.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'Erro ao gerar descrição.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content || '';

    return new Response(JSON.stringify({ description }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Generate description error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
