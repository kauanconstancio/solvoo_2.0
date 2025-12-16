import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Você é um moderador de conteúdo para uma plataforma de serviços no Brasil. Sua função é analisar textos e determinar se contêm conteúdo impróprio.

CONTEÚDO PROIBIDO (deve ser rejeitado):
- Palavrões, xingamentos ou linguagem ofensiva
- Discriminação (racial, religiosa, de gênero, orientação sexual, etc.)
- Assédio ou ameaças
- Conteúdo sexual explícito ou sugestivo
- Spam ou propaganda enganosa
- Dados pessoais sensíveis (CPF, cartão de crédito, senhas)
- Links para sites externos suspeitos
- Golpes ou esquemas fraudulentos
- Incitação à violência ou atividades ilegais
- Venda de produtos/serviços ilegais

CONTEÚDO PERMITIDO:
- Descrições normais de serviços
- Informações de contato comerciais (telefone, WhatsApp)
- Avaliações honestas (mesmo negativas, desde que respeitosas)
- Críticas construtivas
- Perguntas e dúvidas

RESPONDA SEMPRE em formato JSON:
{
  "approved": true/false,
  "reason": "motivo da rejeição (se rejeitado)",
  "severity": "low/medium/high" (se rejeitado),
  "flagged_content": "trecho problemático (se rejeitado)"
}

Se o conteúdo for aprovado, retorne apenas:
{
  "approved": true
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!content || !type) {
      return new Response(JSON.stringify({ error: 'Conteúdo e tipo são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const typeLabels: Record<string, string> = {
      service_title: 'título de serviço',
      service_description: 'descrição de serviço',
      review: 'avaliação/comentário',
    };

    const userPrompt = `Analise o seguinte ${typeLabels[type] || 'conteúdo'} e determine se é apropriado para publicação:

"${content}"

Responda APENAS com o JSON de moderação.`;

    console.log('Moderating content:', { type, contentLength: content.length });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.log('Rate limited, auto-approving content');
        return new Response(JSON.stringify({ approved: true, autoApproved: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        console.log('Payment required, auto-approving content');
        return new Response(JSON.stringify({ approved: true, autoApproved: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(JSON.stringify({ approved: true, autoApproved: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '';
    
    console.log('AI moderation response:', aiResponse);

    // Parse JSON response
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        console.log('Moderation result:', result);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
    }

    // Default to approved if parsing fails
    return new Response(JSON.stringify({ approved: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Content moderation error:', error);
    // On error, auto-approve to not block users
    return new Response(JSON.stringify({ approved: true, autoApproved: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
