import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limit configuration - stricter for chatbot
const RATE_LIMIT_MAX_REQUESTS = 20; // 20 messages per window
const RATE_LIMIT_WINDOW_MINUTES = 5; // 5 minute window

const SYSTEM_PROMPT = `Você é o assistente virtual do Solvoo, uma plataforma de marketplace de serviços no Brasil. Seu nome é Solvoo AI.

SOBRE O SOLVOO:
- Solvoo é uma plataforma que conecta clientes a profissionais de diversos serviços (limpeza, fotografia, mecânica, encanamento, etc.)
- Profissionais podem anunciar seus serviços gratuitamente
- Clientes podem buscar serviços por categoria, localização e filtros
- Sistema de avaliações e reviews para garantir qualidade
- Chat integrado para comunicação entre clientes e profissionais

FUNCIONALIDADES PRINCIPAIS:
1. PARA CLIENTES:
   - Buscar serviços por categoria, cidade ou nome
   - Filtrar por preço, avaliação e profissionais verificados
   - Salvar favoritos
   - Chat direto com profissionais
   - Sistema de avaliações

2. PARA PROFISSIONAIS:
   - Criar conta gratuita
   - Anunciar serviços ilimitados
   - Receber contatos de clientes
   - Dashboard com métricas (visualizações, contatos, favoritos)
   - Gerenciar anúncios

PERGUNTAS FREQUENTES:
- "Como anunciar?" → Crie uma conta, vá em "Anunciar Serviço" no menu
- "É grátis?" → Sim, criar conta e anunciar é gratuito
- "Como entrar em contato?" → Clique em "Solicitar Orçamento" na página do serviço
- "Como avaliar?" → Após usar um serviço, acesse a página dele e clique em "Avaliar"
- "Como editar meu anúncio?" → Vá em "Meus Anúncios" no seu perfil

INSTRUÇÕES:
- Seja sempre cordial e prestativo
- Responda em português brasileiro
- Mantenha respostas concisas (máximo 3 parágrafos)
- Se não souber algo, sugira entrar em contato pelo email suporte@solvoo.com.br
- Não invente funcionalidades que não existem
- Sempre que possível, direcione o usuário para a ação específica na plataforma`;

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
    const isAllowed = await checkRateLimit(supabase, clientId, 'support-chatbot');

    if (!isAllowed) {
      console.log(`Rate limit exceeded for: ${clientId}`);
      return new Response(JSON.stringify({ 
        error: 'Limite de mensagens excedido. Aguarde alguns minutos e tente novamente.' 
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': '300'
        },
      });
    }

    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

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
          ...messages,
        ],
        stream: true,
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
        return new Response(JSON.stringify({ error: 'Limite de uso atingido. Entre em contato com o suporte.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'Erro ao processar sua mensagem.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Support chatbot error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
