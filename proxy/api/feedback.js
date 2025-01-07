// /api/feedback.js
import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  console.log('Function started');
  console.log('Request method:', req.method);
  
  // Get the origin from the request headers
  const origin = req.headers.origin;
  console.log('Request origin:', origin);

  // Check if the origin ends with simonwisdom.com
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

  // Set CORS headers only for allowed domains
  res.setHeader('Access-Control-Allow-Origin', origin);
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
    console.log('Request body:', JSON.stringify(req.body));
    
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });

    await octokit.request('POST /repos/{owner}/{repo}/issues', {
      owner: 'simonwisdom',
      repo: 'lab',
      title: req.body.title,
      body: req.body.body,
      labels: req.body.labels,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    
    console.log('Successfully created GitHub issue');
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Feedback Error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ 
      error: 'Error creating GitHub issue',
      details: error.message 
    });
  }
}