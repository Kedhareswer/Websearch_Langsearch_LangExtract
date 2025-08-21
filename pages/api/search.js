export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const {
    query = '',
    count = 10,
    freshness = 'noLimit',
    summary = true,
    deepSearch = false,
  } = req.body || {};

  const apiKey = process.env.LANGSEARCH_API_KEY;
  const base = process.env.LANGSEARCH_BASE_URL || 'https://api.langsearch.com';
  const url = `${base.replace(/\/$/, '')}/v1/web-search`;

  if (!apiKey) {
    return res.status(500).json({ error: 'Missing LANGSEARCH_API_KEY in environment.' });
  }

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, count, freshness, summary }),
    });

    const contentType = upstream.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await upstream.json() : await upstream.text();

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'Upstream error', details: data });
    }

    // Normalize results for the UI while also returning raw data
    let results = [];
    let summaryText = undefined;

    try {
      // Path 1: data.data.webPages.value (as used by langsearch_api_example.py)
      const value = data?.data?.webPages?.value;
      if (Array.isArray(value)) {
        results = value.map((r) => ({
          title: r.name || r.title || 'Untitled',
          url: r.url,
          snippet: r.snippet,
        }));
        summaryText = data?.data?.summary;
      }
    } catch (_) {}

    if (results.length === 0) {
      // Path 2: data.results (as used by test_langsearch.py)
      const arr = Array.isArray(data?.results) ? data.results : [];
      results = arr.map((r) => ({
        title: r.title || r.name || 'Untitled',
        url: r.url,
        snippet: r.snippet,
      }));
      summaryText = data?.summary || summaryText;
    }

    // Optional semantic reranking for Deep Search mode
    if (deepSearch && results.length > 0) {
      try {
        const rerankRes = await fetch(`${base.replace(/\/$/, '')}/v1/rerank`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'langsearch-reranker-v1',
            query,
            documents: results.map((r) => r.snippet || r.title || ''),
            top_n: results.length,
            return_documents: true,
          }),
        });
        const rerankJson = await rerankRes.json();
        if (rerankRes.ok && Array.isArray(rerankJson?.results)) {
          // results indices refer to original array positions
          const ordered = rerankJson.results
            .sort((a, b) => b.score - a.score)
            .map((r) => results[r.index]);
          results = ordered;
        }
      } catch (err) {
        console.error('Rerank error:', err);
      }
    }

    return res.status(200).json({
      ok: true,
      results,
      summary: summaryText,
      raw: data,
    });
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Proxy failure', details: String(err) });
  }
}
