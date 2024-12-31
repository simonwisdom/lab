import fetch from 'node-fetch';

export default async function handler(req, res) {
  console.log('Function started');
  console.log('Request method:', req.method);

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    console.log('API Key present:', !!apiKey);
    console.log('API Key length:', apiKey?.length);
    
    console.log('Request body:', JSON.stringify(req.body));

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(req.body)
    });
    
    console.log('Google API Response Status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Google API Error:', errorData);
      return res.status(response.status).json({ 
        error: 'Error calling Google API',
        details: errorData,
        status: response.status
      });
    }

    const data = await response.json();
    console.log('Successfully got response from Google API');
    res.json(data);
  } catch (error) {
    console.error('Proxy Error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ 
      error: 'Error calling Google API',
      details: error.message
    });
  }
}