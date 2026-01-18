import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limit configuration
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per window
const RATE_LIMIT_WINDOW_MINUTES = 1; // 1 minute window

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check rate limit
    const clientId = getClientIdentifier(req);
    const isAllowed = await checkRateLimit(supabase, clientId, 'suggest-price');

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

    const { category, subcategory, state, city } = await req.json();
    
    if (!category) {
      return new Response(JSON.stringify({ error: 'Categoria é obrigatória' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Query similar services
    let query = supabase
      .from('services')
      .select('price, price_type, category, subcategory, state, city, title')
      .eq('status', 'active')
      .eq('category', category);

    if (subcategory) {
      query = query.eq('subcategory', subcategory);
    }

    const { data: services, error } = await query.limit(50);

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    if (!services || services.length === 0) {
      return new Response(JSON.stringify({
        suggestion: null,
        message: 'Não há serviços similares cadastrados para análise.',
        servicesAnalyzed: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse prices and calculate statistics
    const prices: number[] = [];
    const pricesByType: Record<string, number[]> = {
      fixed: [],
      hour: [],
      day: [],
      project: [],
    };

    // Services in same location
    const localServices: number[] = [];

    services.forEach((service: any) => {
      const priceMatch = service.price.match(/[\d.,]+/);
      if (priceMatch) {
        const price = parseFloat(priceMatch[0].replace('.', '').replace(',', '.'));
        if (!isNaN(price) && price > 0) {
          prices.push(price);
          if (service.price_type && pricesByType[service.price_type]) {
            pricesByType[service.price_type].push(price);
          }
          // Check if same location
          if (state && city && service.state === state && service.city === city) {
            localServices.push(price);
          }
        }
      }
    });

    if (prices.length === 0) {
      return new Response(JSON.stringify({
        suggestion: null,
        message: 'Não foi possível analisar os preços dos serviços.',
        servicesAnalyzed: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate statistics
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const min = sortedPrices[0];
    const max = sortedPrices[sortedPrices.length - 1];
    const median = sortedPrices[Math.floor(sortedPrices.length / 2)];
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

    // Calculate percentiles for range suggestion
    const p25 = sortedPrices[Math.floor(sortedPrices.length * 0.25)];
    const p75 = sortedPrices[Math.floor(sortedPrices.length * 0.75)];

    // Local market stats
    let localStats = null;
    if (localServices.length >= 3) {
      const sortedLocal = [...localServices].sort((a, b) => a - b);
      localStats = {
        min: sortedLocal[0],
        max: sortedLocal[sortedLocal.length - 1],
        avg: localServices.reduce((a, b) => a + b, 0) / localServices.length,
        count: localServices.length,
      };
    }

    // Generate AI insights
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    let aiInsight = '';

    if (LOVABLE_API_KEY) {
      try {
        const prompt = `Analise estes dados de mercado para a categoria "${category}"${subcategory ? ` (${subcategory})` : ''} e dê uma sugestão de preço em 2-3 frases curtas:

Dados do mercado:
- Preço mínimo: R$ ${min.toFixed(2)}
- Preço máximo: R$ ${max.toFixed(2)}
- Preço médio: R$ ${avg.toFixed(2)}
- Preço mediano: R$ ${median.toFixed(2)}
- Total de serviços analisados: ${prices.length}
${localStats ? `\nMercado local (${city}/${state}):
- Média local: R$ ${localStats.avg.toFixed(2)}
- ${localStats.count} serviços na região` : ''}

Seja direto e objetivo. Sugira um preço competitivo.`;

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-lite',
            messages: [
              { role: 'system', content: 'Você é um consultor de precificação. Dê sugestões práticas e objetivas em português.' },
              { role: 'user', content: prompt },
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          aiInsight = aiData.choices?.[0]?.message?.content || '';
        }
      } catch (aiError) {
        console.error('AI insight error:', aiError);
      }
    }

    const response = {
      suggestion: {
        recommended: Math.round(median),
        range: {
          min: Math.round(p25),
          max: Math.round(p75),
        },
        market: {
          min: Math.round(min),
          max: Math.round(max),
          avg: Math.round(avg),
          median: Math.round(median),
        },
        localMarket: localStats ? {
          avg: Math.round(localStats.avg),
          count: localStats.count,
        } : null,
      },
      insight: aiInsight,
      servicesAnalyzed: prices.length,
      category,
      subcategory: subcategory || null,
    };

    console.log('Price suggestion response:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Price suggestion error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
