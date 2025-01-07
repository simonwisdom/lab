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
    await octokit.issues.create({
      owner: 'simonwisdom',
      repo: 'lab',
      title: req.body.title,
      body: req.body.body,
      labels: req.body.labels
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}