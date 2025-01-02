const fetch = require('node-fetch');

module.exports = async function handler(req, res) {
  const origin = req.headers.origin;
  const isAllowed = origin && (
    origin.endsWith('simonwisdom.com') 
  );
  
  if (!isAllowed) {
    return res.status(403).json({
      error: 'Unauthorized origin'
    });
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Expect the target URL in the query string
    const targetUrl = req.query.url;
    
    if (!targetUrl) {
      return res.status(400).json({ error: 'Missing target URL' });
    }

    // Make the request to the target URL
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SitemapFinder/1.0)',
      }
    });

    // Get the content type from the response
    const contentType = response.headers.get('content-type');
    res.setHeader('Content-Type', contentType || 'text/plain');

    // Stream the response back
    const data = await response.text();
    res.send(data);

  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ 
      error: 'Error proxying request',
      details: error.message 
    });
  }
};