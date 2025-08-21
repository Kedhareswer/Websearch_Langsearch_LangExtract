// Serverless, Netlify-friendly: generates structured summary using Gemini directly.
// Requires env: GEMINI_API_KEY

import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { query, results, thinkMode = false } = req.body || {};
  if (!query || !Array.isArray(results) || results.length === 0) {
    return res.status(400).json({ error: 'Query and non-empty results are required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'Missing GEMINI_API_KEY', message: 'Set GEMINI_API_KEY in your Netlify environment variables.' });
  }

  try {
    // Compose a compact document from results
    const combined = [
      `Search Query: ${query}`,
      '',
      'Search Results:',
      ...results.map((r, i) => `\nResult ${i + 1}:\nTitle: ${r.title || ''}\nURL: ${r.url || ''}\nContent: ${r.snippet || ''}`)
    ].join('\n');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Structured output schema matching the UI contract
    const responseSchema = {
      type: 'object',
      properties: {
        main_topic: { type: 'string' },
        key_points: { type: 'array', items: { type: 'string' } },
        comprehensive_summary: { type: 'string' },
        key_entities: { type: 'array', items: { type: 'string' } },
        main_conclusion: { type: 'string' },
        thought_process: { type: 'string' }
      },
      required: ['main_topic', 'key_points', 'comprehensive_summary', 'key_entities', 'main_conclusion']
    };

    const prompt = `You are an expert synthesis engine. Read the provided search results and return a concise, accurate JSON per the schema. ${thinkMode ? 'Additionally include a detailed thought_process field explaining step-by-step reasoning used to reach the summary.' : ''}`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `${prompt}\n\n${combined}` }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1200,
        responseMimeType: 'application/json',
        responseSchema
      }
    });

    const text = result.response?.text();
    let summary;
    try {
      summary = JSON.parse(text || '{}');
    } catch {
      // Fallback: minimal structure if parsing fails
      summary = {
        main_topic: query,
        key_points: [],
        comprehensive_summary: text || 'Summary generation failed',
        key_entities: [],
        main_conclusion: ''
      };
    }

    const payload = {
      success: true,
      query,
      summary,
      formatted_text: [
        `📌 **${summary.main_topic || ''}**`,
        '',
        '**Key Points:**',
        ...(summary.key_points || []).map(p => `• ${p}`),
        '',
        '**Summary:**',
        summary.comprehensive_summary || '',
        '',
        `**Key Entities:** ${(summary.key_entities || []).join(', ') || 'None identified'}`,
        '',
        `**Conclusion:** ${summary.main_conclusion || ''}`
      ].join('\n')
    };

    return res.status(200).json(payload);
  } catch (error) {
    console.error('Gemini summary error:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || String(error),
      message: 'Failed to generate summary with Gemini'
    });
  }
}
