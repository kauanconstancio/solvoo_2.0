import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const serviceId = url.searchParams.get('id');

    if (!serviceId) {
      console.error('Missing service ID');
      return new Response('Missing service ID', { status: 400 });
    }

    console.log(`Fetching OG data for service: ${serviceId}`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch service data
    const { data: service, error } = await supabase
      .from('services')
      .select('id, title, description, price, category, subcategory, images, city, state')
      .eq('id', serviceId)
      .eq('status', 'active')
      .single();

    if (error || !service) {
      console.error('Service not found:', error);
      return new Response('Service not found', { status: 404 });
    }

    console.log(`Found service: ${service.title}`);

    // Get the first image or use a default
    const imageUrl = service.images && service.images.length > 0
      ? service.images[0]
      : `${supabaseUrl}/storage/v1/object/public/service-images/default-service.jpg`;

    // Build the canonical URL for the service
    const siteUrl = url.origin.replace('supabase.co/functions/v1/og-service', 'lovable.app');
    const canonicalUrl = `${siteUrl}/servico/${service.id}`;

    // Truncate description for OG
    const description = service.description 
      ? service.description.substring(0, 155) + (service.description.length > 155 ? '...' : '')
      : `Serviço de ${service.category} em ${service.city}, ${service.state}`;

    const title = `${service.title} | Solvoo`;
    const location = `${service.city}, ${service.state}`;

    // Generate HTML with OG meta tags
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${escapeHtml(title)}</title>
  <meta name="title" content="${escapeHtml(title)}">
  <meta name="description" content="${escapeHtml(description)}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="product">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:site_name" content="Solvoo">
  <meta property="product:price:amount" content="${escapeHtml(service.price)}">
  <meta property="product:price:currency" content="BRL">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${canonicalUrl}">
  <meta property="twitter:title" content="${escapeHtml(title)}">
  <meta property="twitter:description" content="${escapeHtml(description)}">
  <meta property="twitter:image" content="${escapeHtml(imageUrl)}">
  
  <!-- Additional Meta -->
  <meta name="geo.placename" content="${escapeHtml(location)}">
  <link rel="canonical" href="${canonicalUrl}">
  
  <!-- Redirect to SPA for browsers -->
  <meta http-equiv="refresh" content="0;url=${canonicalUrl}">
  <script>window.location.href = "${canonicalUrl}";</script>
</head>
<body>
  <p>Redirecionando para <a href="${canonicalUrl}">${escapeHtml(service.title)}</a>...</p>
</body>
</html>`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating OG tags:', error);
    return new Response('Internal server error', { status: 500 });
  }
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
