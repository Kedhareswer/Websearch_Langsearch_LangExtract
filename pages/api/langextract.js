export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { query, results } = req.body;

  if (!query || !results) {
    return res.status(400).json({ error: 'Query and results are required' });
  }

  const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:5000';

  // Guard: Netlify (or other hosts) cannot reach your local machine.
  // If the request host is not localhost but PYTHON_SERVICE_URL points to localhost, surface a helpful error.
  const requestHost = req.headers['host'] || '';
  const isRequestLocal = requestHost.includes('localhost') || requestHost.includes('127.0.0.1');
  const isPythonLocal = /^(http:\/\/|https:\/\/)localhost|127\.0\.0\.1/.test(pythonServiceUrl);
  if (!isRequestLocal && isPythonLocal) {
    return res.status(500).json({
      success: false,
      error: 'PYTHON_SERVICE_URL is pointing to localhost in a hosted environment',
      message:
        'Your site is running on a remote host (e.g., Netlify), but PYTHON_SERVICE_URL=' +
        pythonServiceUrl +
        ' points to localhost. Deploy the Python service to a public URL (Railway/Render/Fly/EC2/etc) and set PYTHON_SERVICE_URL to that URL. Also allow your Netlify domain in the Python CORS.',
    });
  }

  try {
    // Call Python LangExtract service with a timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(`${pythonServiceUrl.replace(/\/$/, '')}/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        results
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Python service error: ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('LangExtract API error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.name === 'AbortError' ? 'Python service timed out' : error.message,
      message: 'Failed to generate summary with LangExtract',
      hint: 'Ensure PYTHON_SERVICE_URL is publicly reachable from your hosting provider and CORS allows your site.'
    });
  }
}
