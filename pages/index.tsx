import { useState, useEffect, useRef } from 'react'
import { Component as OpenAICodexBackground } from "@/components/ui/open-ai-codex-animated-background";
import { AIChatInput } from "@/components/ui/ai-chat-input";
import LatestNews from "@/components/ui/latest-news";
import { Amarante } from 'next/font/google'
import { ArrowRight, Github, Instagram, Twitter } from 'lucide-react'

const amarante = Amarante({ subsets: ['latin'], weight: '400' })

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

interface LangExtractSummary {
  main_topic: string;
  key_points: string[];
  comprehensive_summary: string;
  key_entities: string[];
  main_conclusion: string;
  thought_process?: string;
}

interface LangExtractResponse {
  success: boolean;
  query: string;
  thinkMode?: boolean;
  summary: LangExtractSummary;
  formatted_text: string;
  error?: string;
}

export default function Home() {
  const [query, setQuery] = useState('')
  const [count, setCount] = useState(5)
  const [results, setResults] = useState<SearchResult[]>([])
  const [summary, setSummary] = useState('')
  const [langExtractSummary, setLangExtractSummary] = useState<LangExtractResponse | null>(null)
  const [raw, setRaw] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [extractLoading, setExtractLoading] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showNews, setShowNews] = useState(false)
  const [isSnapping, setIsSnapping] = useState(false)
  const ctaRef = useRef<HTMLButtonElement | null>(null)

  const searchWithQuery = async (q: string, options?: { thinkMode?: boolean; deepSearch?: boolean }) => {
    setLoading(true)
    setError(null)
    setResults([])
    setSummary('')
    setLangExtractSummary(null)
    setExtractError(null)

    try {
      // Deep Search: more results + better freshness + semantic reranking
      const searchCount = options?.deepSearch ? Math.max(count * 2, 15) : count
      const freshness = options?.deepSearch ? '7d' : 'noLimit'
      
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: q, 
          count: searchCount, 
          freshness, 
          summary: true,
          deepSearch: options?.deepSearch || false
        })
      })

      const data: SearchResponse = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.details ? JSON.stringify(data.details) : data.error || 'Request failed')
      }

      setResults(data.results || [])
      setSummary(data.summary || '')
      setRaw(data.raw || null)

      // Call LangExtract for enhanced summary if we have results
      if (data.results && data.results.length > 0) {
        setExtractLoading(true)
        try {
          const extractRes = await fetch('/api/langextract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              query: q, 
              results: data.results,
              thinkMode: options?.thinkMode || false
            })
          })

          const extractData: LangExtractResponse = await extractRes.json()
          if (extractRes.ok && extractData.success) {
            setLangExtractSummary(extractData)
          } else {
            setExtractError(extractData?.error || 'AI summary unavailable')
          }
        } catch (extractErr) {
          console.error('LangExtract error:', extractErr)
          setExtractError(extractErr instanceof Error ? extractErr.message : String(extractErr))
          // Continue with regular results; Original summary section will still render if present
        } finally {
          setExtractLoading(false)
        }
      }
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

  const openLatestNews = () => {
    // Trigger Thanos Snap on hero, then show news
    setIsSnapping(true)
    const SNAP_DURATION_MS = 1000
    setTimeout(() => {
      setShowNews(true)
      setIsSnapping(false)
    }, SNAP_DURATION_MS)
  }

  const closeLatestNews = () => {
    setShowNews(false)
    // Restore focus to CTA after view closes
    requestAnimationFrame(() => ctaRef.current?.focus())
  }

  // Close Latest News with Escape key
  useEffect(() => {
    if (!showNews) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLatestNews()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showNews])

  return (
    <main className="relative min-h-screen">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <OpenAICodexBackground />
      </div>
      {/* Contrast Overlay */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black/50 via-black/25 to-background/85" />

      {/* Foreground content */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 space-y-10 relative z-10">
        {/* Hero: title, input, subtitle, CTA */}
        {!showNews && (
        <section className="min-h-[60vh] flex items-center justify-center">
          <div className={`w-full max-w-3xl text-center ${isSnapping ? 'thanos-snap' : ''}`}>
            <h1
              className={`${amarante.className} text-[56px] md:text-[88px] leading-tight text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] mb-8`}
            >
              Next Search
            </h1>
            <AIChatInput
              initialValue={query}
              onSend={(text, options) => {
                if (text) {
                  setQuery(text)
                  searchWithQuery(text, options)
                }
              }}
            />

            {/* Subtitle */}
            <p className="mt-6 text-white/90 text-base md:text-lg max-w-2xl mx-auto">
              Stay updated with the latest news and exclusive content! Search smarter with AI-powered results and never miss out on exciting updates.
            </p>

            {/* CTA */}
            <div className="mt-6">
              <button
                type="button"
                onClick={openLatestNews}
                aria-label="Open latest news"
                aria-controls="latest-news-section"
                aria-expanded={showNews}
                ref={ctaRef}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/25 hover:bg-white/35 border border-white/30 text-white backdrop-blur-2xl shadow-lg ring-1 ring-black/5 transition"
              >
                Latest News <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </section>
        )}

        {showNews && (
          <LatestNews onBack={closeLatestNews} />
        )}

        {error && (
          <div className="p-4 border border-destructive bg-destructive/10 text-destructive rounded-md">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* LangExtract AI Summary Section */}
        {(langExtractSummary || extractLoading || extractError) && (
          <section className="space-y-4">
            <div className="relative p-6 rounded-2xl border bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl shadow-xl
                            border-white/20 ring-1 ring-black/5 overflow-hidden">
              <div className="pointer-events-none absolute inset-0 rounded-2xl [mask-image:radial-gradient(70%_70%_at_50%_0%,black,transparent)]
                              bg-gradient-to-b from-primary/10 to-transparent" />
              <h2 className="text-xl font-bold mb-4 text-foreground flex items-center gap-2">
                <span className="text-2xl">🤖</span> AI-Powered Summary by LangExtract
              </h2>
              {extractLoading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 w-40 bg-foreground/10 rounded" />
                  <div className="h-3 w-full bg-foreground/10 rounded" />
                  <div className="h-3 w-11/12 bg-foreground/10 rounded" />
                  <div className="h-3 w-10/12 bg-foreground/10 rounded" />
                </div>
              ) : extractError ? (
                <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200">
                  <div className="font-semibold mb-1">AI summary unavailable</div>
                  <div className="text-sm opacity-90">{extractError}</div>
                </div>
              ) : langExtractSummary?.success ? (
                <div className="space-y-4">
                  {/* Main Topic */}
                  <div className="text-lg font-semibold text-primary">
                    📌 {langExtractSummary.summary.main_topic}
                  </div>
                  
                  {/* Key Points */}
                  {langExtractSummary.summary.key_points.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Key Points:</h3>
                      <ul className="space-y-1">
                        {langExtractSummary.summary.key_points.map((point, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Comprehensive Summary */}
                  <div>
                    <h3 className="font-semibold mb-2">Summary:</h3>
                    <p className="text-foreground leading-relaxed">
                      {langExtractSummary.summary.comprehensive_summary}
                    </p>
                  </div>
                  
                  {/* Key Entities */}
                  {langExtractSummary.summary.key_entities.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Key Entities:</h3>
                      <div className="flex flex-wrap gap-2">
                        {langExtractSummary.summary.key_entities.map((entity, i) => (
                          <span key={i} className="px-3 py-1 bg-primary/10 rounded-full text-sm">
                            {entity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Main Conclusion */}
                  <div className="p-4 bg-primary/5 rounded-lg border-l-4 border-primary">
                    <h3 className="font-semibold mb-1">Conclusion:</h3>
                    <p className="text-foreground">
                      {langExtractSummary.summary.main_conclusion}
                    </p>
                  </div>

                  {/* Thought process (collapsible, only when Think Mode is enabled) */}
                  {langExtractSummary.thinkMode && langExtractSummary.summary.thought_process && (
                    <details className="mt-4 space-y-2">
                      <summary className="cursor-pointer font-semibold text-primary">
                        Show reasoning steps
                      </summary>
                      <pre className="whitespace-pre-wrap text-sm leading-relaxed bg-muted/50 p-3 rounded-md">
                        {langExtractSummary.summary.thought_process}
                      </pre>
                    </details>
                  )}
                </div>
              ) : null}
            </div>
          </section>
        )}

        {/* Original LangSearch Summary */}
        {summary && (
          <section className="space-y-4">
            <div className="p-4 bg-muted rounded-md border">
              <h3 className="font-semibold mb-2">Original LangSearch Summary:</h3>
              <div className="whitespace-pre-wrap">
                {summary}
              </div>
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

      {/* Socials row */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4">
        <a
          href="#instagram"
          className="w-10 h-10 rounded-full bg-[#e0aaa7]/20 hover:bg-[#e0aaa7]/30 border border-[#e0aaa7]/40 backdrop-blur-md flex items-center justify-center text-[#e0aaa7] transition transform duration-200 ease-out hover:scale-110 hover:-translate-y-0.5 hover:ring-2 hover:ring-[#e0aaa7]/60"
          aria-label="Instagram"
        >
          <Instagram size={18} />
        </a>
        <a
          href="#twitter"
          className="w-10 h-10 rounded-full bg-[#e0aaa7]/20 hover:bg-[#e0aaa7]/30 border border-[#e0aaa7]/40 backdrop-blur-md flex items-center justify-center text-[#e0aaa7] transition transform duration-200 ease-out hover:scale-110 hover:-translate-y-0.5 hover:ring-2 hover:ring-[#e0aaa7]/60"
          aria-label="Twitter (X)"
        >
          <Twitter size={18} />
        </a>
        <a
          href="https://github.com/Kedhareswer/Websearch_Langsearch_LangExtract"
          target="_blank"
          rel="noreferrer noopener"
          className="w-10 h-10 rounded-full bg-[#e0aaa7]/20 hover:bg-[#e0aaa7]/30 border border-[#e0aaa7]/40 backdrop-blur-md flex items-center justify-center text-[#e0aaa7] transition transform duration-200 ease-out hover:scale-110 hover:-translate-y-0.5 hover:ring-2 hover:ring-[#e0aaa7]/60"
          aria-label="GitHub"
        >
          <Github size={18} />
        </a>
      </div>
    </main>
  )
}
