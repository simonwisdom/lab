export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const url = new URL(req.url);
  const origin = req.headers.get('origin');
  const isAllowed = origin && (
    origin.endsWith('simonwisdom.com')
  );
  
  if (!isAllowed) {
    return new Response(JSON.stringify({
      error: 'Unauthorized origin'
    }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Set CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const targetUrl = url.searchParams.get('url');
    
    if (!targetUrl) {
      return new Response(JSON.stringify({ error: 'Missing target URL' }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Make the request to the target URL
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SitemapFinder/1.0)',
      }
    });

    // Get the response content
    const data = await response.text();
    const contentType = response.headers.get('content-type');

    // Return the proxied response
    return new Response(data, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType || 'text/plain'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Error proxying request',
      details: error.message 
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}