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

  try {
    // Call Python LangExtract service
    const response = await fetch(`${pythonServiceUrl}/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        results
      })
    });

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
      error: error.message,
      message: 'Failed to generate summary with LangExtract'
    });
  }
}
