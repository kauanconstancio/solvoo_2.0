import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
