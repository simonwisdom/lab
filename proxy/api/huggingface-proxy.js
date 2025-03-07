import fetch from 'node-fetch';

export default async function handler(req, res) {
  console.log('Function started');
  console.log('Request method:', req.method);
  
  const origin = req.headers.origin;
  console.log('Request origin:', origin);

  const isAllowed = origin && (
    origin.endsWith('simonwisdom.com') 
  );
  
  if (!isAllowed) {
    console.log('Unauthorized origin:', origin);
    return res.status(403).json({
      error: 'Unauthorized origin',
      message: 'This endpoint can only be accessed from allowed domains'
    });
  }

  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    console.log('API Key present:', !!apiKey);
    console.log('API Key length:', apiKey?.length);
    
    const { model, ...requestBody } = req.body;
    const modelId = model || 'google/gemma-2-2b-it';
    
    console.log('Using model:', modelId);
    console.log('Request body:', JSON.stringify(requestBody));

    const response = await fetch(`https://api-inference.huggingface.co/models/${modelId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('Hugging Face API Response Status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Hugging Face API Error:', errorData);
      return res.status(response.status).json({ 
        error: 'Error calling Hugging Face API',
        details: errorData,
        status: response.status
      });
    }

    const data = await response.json();
    console.log('Successfully got response from Hugging Face API');
    res.json(data);
  } catch (error) {
    console.error('Proxy Error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ 
      error: 'Error calling Hugging Face API',
      details: error.message
    });
  }
}