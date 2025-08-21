import { useState } from 'react'

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface SearchResponse {
  results?: SearchResult[];
  summary?: string;
  raw?: any;
  error?: string;
  details?: any;
}

export default function Home() {
  const [query, setQuery] = useState('What is LangSearch?')
  const [count, setCount] = useState(5)
  const [results, setResults] = useState<SearchResult[]>([])
  const [summary, setSummary] = useState('')
  const [raw, setRaw] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResults([])
    setSummary('')

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, count, freshness: 'noLimit', summary: true })
      })

      const data: SearchResponse = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.details ? JSON.stringify(data.details) : data.error || 'Request failed')
      }

      setResults(data.results || [])
      setSummary(data.summary || '')
      setRaw(data.raw || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-4xl mx-auto p-6 min-h-screen">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">LangSearch Web App</h1>
          <p className="text-muted-foreground mt-2">Enter a query and view results powered by your API key.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Your Search
            </label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything…"
              className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2 max-w-40">
            <label className="text-sm font-medium text-foreground">
              Result Count
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex items-center gap-4">
            <button 
              type="submit" 
              disabled={loading} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching…' : 'Search'}
            </button>
            {loading && <span className="text-muted-foreground">Fetching results…</span>}
          </div>
        </form>

        {error && (
          <div className="p-4 border border-destructive bg-destructive/10 text-destructive rounded-md">
            <strong>Error:</strong> {error}
          </div>
        )}

        {summary && (
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Summary</h2>
            <div className="p-4 bg-muted rounded-md border whitespace-pre-wrap">
              {summary}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Results ({results.length})</h2>
          <div className="space-y-4">
            {results.map((r, i) => (
              <div key={i} className="p-4 border border-border rounded-md bg-card">
                <a 
                  href={r.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-lg font-semibold text-primary hover:underline"
                >
                  {r.title}
                </a>
                {r.url && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {r.url}
                  </div>
                )}
                {r.snippet && (
                  <p className="mt-2 text-foreground">
                    {r.snippet}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {raw && (
          <details className="space-y-2">
            <summary className="cursor-pointer font-semibold text-foreground">
              Show raw response
            </summary>
            <pre className="overflow-x-auto bg-muted p-4 rounded-md text-sm">
              {JSON.stringify(raw, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </main>
  )
}
