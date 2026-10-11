// Vercel Serverless Function to proxy Tally requests to Cloudflare tunnel
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Tally-URL');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const targetUrl = req.headers['x-tally-url'] || process.env.TALLY_URL || 'https://competition-recovered-commented-nevada.trycloudflare.com/?key=infra_e35b972d8abf4487';

  try {
    const rawXml = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const tallyResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'User-Agent': 'TallyMobilePOS/1.0'
      },
      body: req.body,
      signal: controller.signal
    });
    clearTimeout(timeout);

    const respText = await tallyResponse.text();
    res.setHeader('Content-Type', tallyResponse.headers.get('content-type') || 'text/xml');
    return res.status(tallyResponse.status).send(respText);
  } catch (err) {
    return res.status(502).json({
      error: 'Tally Gateway Unreachable',
      details: err.message,
      targetUrl
    });
  }
}
