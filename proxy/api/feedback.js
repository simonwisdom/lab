// /api/feedback.js
import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
  });

  try {
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
    
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}