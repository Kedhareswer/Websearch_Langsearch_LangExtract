import { useState } from 'react'
import { Component as OpenAICodexBackground } from "@/components/ui/open-ai-codex-animated-background";
import { AIChatInput } from "@/components/ui/ai-chat-input";

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

  const searchWithQuery = async (q: string) => {
    setLoading(true)
    setError(null)
    setResults([])
    setSummary('')

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, count, freshness: 'noLimit', summary: true })
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await searchWithQuery(query)
  }

  return (
    <main className="relative min-h-screen">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <OpenAICodexBackground />
      </div>
      {/* Contrast Overlay */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black/40 via-black/20 to-background/80" />

      {/* Foreground content */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 space-y-10 relative z-10">
        {/* Center only the input */}
        <section className="min-h-[60vh] flex items-center justify-center">
          <div className="w-full max-w-3xl">
            <AIChatInput
              initialValue={query}
              onSend={(text) => {
                if (text) {
                  setQuery(text)
                  searchWithQuery(text)
                }
              }}
            />
          </div>
        </section>

        {error && (
          <div className="p-4 border border-destructive bg-destructive/10 text-destructive rounded-md">
            <strong>Error:</strong> {error}
          </div>
        )}

        {summary && (
          <section className="space-y-4">
            <div className="p-4 bg-muted rounded-md border whitespace-pre-wrap">
              {summary}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <div className="space-y-4">
            {results.map((r, i) => (
              <div key={i} className="p-4 rounded-xl border border-white/20 bg-white/80 dark:bg-zinc-900/60 backdrop-blur shadow-md hover:shadow-lg transition-shadow">
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
