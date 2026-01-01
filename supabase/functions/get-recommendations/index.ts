import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // If no authenticated user, return popular services
    if (!userId) {
      const { data: popularServices } = await supabase
        .from("services")
        .select("id, title, category, subcategory, price, price_type, city, state, images, verified, user_id, views_count, favorites_count")
        .eq("status", "active")
        .order("views_count", { ascending: false })
        .limit(6);

      return new Response(
        JSON.stringify({ 
          recommendations: popularServices || [],
          reason: "Serviços mais populares"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gather user behavior data
    const [favoritesResult, viewsResult, profileResult] = await Promise.all([
      supabase
        .from("favorites")
        .select("service_category, service_subcategory")
        .eq("user_id", userId),
      supabase
        .from("service_views")
        .select("service_id, services(category, subcategory, city, state)")
        .eq("viewer_id", userId)
        .order("viewed_at", { ascending: false })
        .limit(50),
      supabase
        .from("profiles")
        .select("city, state")
        .eq("user_id", userId)
        .single()
    ]);

    const favorites = favoritesResult.data || [];
    const views = viewsResult.data || [];
    const userProfile = profileResult.data;

    // Analyze preferences
    const categoryCount: Record<string, number> = {};
    const subcategoryCount: Record<string, number> = {};
    const locationCount: Record<string, number> = {};

    // Count from favorites (weighted more)
    favorites.forEach((fav) => {
      if (fav.service_category) {
        categoryCount[fav.service_category] = (categoryCount[fav.service_category] || 0) + 3;
      }
      if (fav.service_subcategory) {
        subcategoryCount[fav.service_subcategory] = (subcategoryCount[fav.service_subcategory] || 0) + 3;
      }
    });

    // Count from views
    views.forEach((view: any) => {
      const service = view.services;
      if (service?.category) {
        categoryCount[service.category] = (categoryCount[service.category] || 0) + 1;
      }
      if (service?.subcategory) {
        subcategoryCount[service.subcategory] = (subcategoryCount[service.subcategory] || 0) + 1;
      }
      if (service?.city && service?.state) {
        const loc = `${service.city}|${service.state}`;
        locationCount[loc] = (locationCount[loc] || 0) + 1;
      }
    });

    // Get top preferences
    const topCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    const topSubcategories = Object.entries(subcategoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([sub]) => sub);

    const topLocations = Object.entries(locationCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([loc]) => {
        const [city, state] = loc.split("|");
        return { city, state };
      });

    // Add user's profile location if available
    if (userProfile?.city && userProfile?.state) {
      const userLoc = { city: userProfile.city, state: userProfile.state };
      if (!topLocations.find(l => l.city === userLoc.city && l.state === userLoc.state)) {
        topLocations.push(userLoc);
      }
    }

    // Get viewed service IDs to exclude
    const viewedServiceIds = views.map((v: any) => v.service_id).filter(Boolean);

    // Build recommendation query
    let query = supabase
      .from("services")
      .select("id, title, category, subcategory, price, price_type, city, state, images, verified, user_id, views_count, favorites_count")
      .eq("status", "active")
      .neq("user_id", userId);

    // Exclude already viewed services
    if (viewedServiceIds.length > 0) {
      query = query.not("id", "in", `(${viewedServiceIds.slice(0, 20).join(",")})`);
    }

    // Filter by preferred categories if any
    if (topCategories.length > 0) {
      query = query.in("category", topCategories);
    }

    const { data: recommendedServices } = await query
      .order("views_count", { ascending: false })
      .limit(12);

    let recommendations = recommendedServices || [];

    // If we have location preferences, prioritize local services
    if (topLocations.length > 0 && recommendations.length > 0) {
      recommendations.sort((a, b) => {
        const aLocal = topLocations.some(l => a.city === l.city && a.state === l.state) ? 1 : 0;
        const bLocal = topLocations.some(l => b.city === l.city && b.state === l.state) ? 1 : 0;
        return bLocal - aLocal;
      });
    }

    // Use AI to generate personalized reason
    let reason = "Baseado no seu histórico";
    
    if (topCategories.length > 0 || topLocations.length > 0) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      
      if (LOVABLE_API_KEY) {
        try {
          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "system",
                  content: "Você é um assistente que gera frases curtas e amigáveis para explicar recomendações personalizadas. Responda apenas com a frase, sem aspas ou pontuação extra. Máximo 60 caracteres."
                },
                {
                  role: "user",
                  content: `Gere uma frase curta explicando por que estamos recomendando serviços.
Categorias preferidas: ${topCategories.join(", ") || "nenhuma"}
Locais preferidos: ${topLocations.map(l => `${l.city}, ${l.state}`).join("; ") || "nenhum"}
Exemplo: "Serviços de limpeza perto de você"`
                }
              ],
              max_tokens: 50
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const aiReason = aiData.choices?.[0]?.message?.content?.trim();
            if (aiReason) {
              reason = aiReason;
            }
          }
        } catch (e) {
          console.error("AI reason generation failed:", e);
        }
      }
    }

    // If no personalized recommendations, fall back to popular
    if (recommendations.length === 0) {
      const { data: popularServices } = await supabase
        .from("services")
        .select("id, title, category, subcategory, price, price_type, city, state, images, verified, user_id, views_count, favorites_count")
        .eq("status", "active")
        .neq("user_id", userId)
        .order("views_count", { ascending: false })
        .limit(6);

      recommendations = popularServices || [];
      reason = "Serviços populares para você";
    }

    return new Response(
      JSON.stringify({ 
        recommendations: recommendations.slice(0, 6),
        reason
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error getting recommendations:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao obter recomendações", recommendations: [], reason: "" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
