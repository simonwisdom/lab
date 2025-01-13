export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const url = new URL(req.url);
  const origin = req.headers.get('origin');
  const isAllowed = origin && origin.endsWith('simonwisdom.com');

  if (!isAllowed) {
    return new Response(JSON.stringify({ error: 'Unauthorized origin' }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Set CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const targetUrl = url.searchParams.get('url');
    if (!targetUrl) {
      return new Response(JSON.stringify({ error: 'Missing target URL' }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }

    // Make the request to the target URL
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SitemapFinder/1.0)',
      },
    });

    // Remove restrictive headers and retain only essential ones
    const headers = new Headers(response.headers);
    headers.delete('content-security-policy'); // Strip CSP
    headers.delete('x-frame-options'); // Strip X-Frame-Options

    // Get the response body
    const body = await response.text();
    const contentType = headers.get('content-type') || 'text/html';

    return new Response(body, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType, // Ensure correct Content-Type
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Error proxying request',
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}