"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Newspaper, Loader2 } from "lucide-react";
import { Amarante } from 'next/font/google'

const amarante = Amarante({ subsets: ['latin'], weight: '400' })

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export default function LatestNews({ onBack }: { onBack?: () => void }) {
  const [items, setItems] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const backBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchNews = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: "latest news",
            count: 8,
            freshness: "7d",
            summary: false,
            deepSearch: true,
          }),
          // avoid any caching
          cache: "no-store",
        });

        const contentType = res.headers.get("content-type") || "";
        let data: any = null;

        if (contentType.includes("application/json")) {
          try {
            data = await res.json();
          } catch (parseErr) {
            // Body might be empty or malformed – try text to surface details
            const fallbackText = await res.text().catch(() => "");
            throw new Error(
              fallbackText
                ? `Invalid JSON from /api/search: ${fallbackText.slice(0, 200)}`
                : "Empty response from /api/search"
            );
          }
        } else {
          const text = await res.text().catch(() => "");
          throw new Error(
            text ? text.slice(0, 200) : `Non-JSON response (status ${res.status})`
          );
        }

        if (!res.ok || data?.error) throw new Error(data?.error || "Failed to fetch news");
        if (isMounted) {
          setItems(Array.isArray(data?.results) ? data.results : []);
          setLastUpdated(Date.now());
        }
      } catch (e) {
        if (isMounted) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchNews();
    // focus back button when mounted for better accessibility
    requestAnimationFrame(() => {
      backBtnRef.current?.focus();
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // util: extract hostname from URL
  const getHost = (u: string) => {
    try {
      return new URL(u).hostname.replace(/^www\./, "");
    } catch {
      return u;
    }
  };

  return (
    <section id="latest-news-section" className="min-h-[60vh] pb-10" role="region" aria-labelledby="latest-news-heading">
      <div className="relative p-6 rounded-2xl border bg-white/85 dark:bg-zinc-900/70 backdrop-blur-2xl shadow-xl border-white/30 ring-1 ring-black/5 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 rounded-2xl [mask-image:radial-gradient(70%_70%_at_50%_0%,black,transparent)] bg-gradient-to-b from-primary/15 to-transparent" />
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 mb-4 p-3 rounded-xl bg-white/60 dark:bg-zinc-900/60 backdrop-blur border border-white/30">
          <div className="flex items-center gap-3">
            <h2 id="latest-news-heading" className={`${amarante.className} text-xl font-bold text-foreground`}>📰 Latest News</h2>
            {lastUpdated && (
              <span className="text-sm text-muted-foreground">
                Updated {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // retry fetch quickly
                setError(null);
                setLoading(true);
                // trigger effect body without remount by calling inline fetch
                (async () => {
                  try {
                    const res = await fetch("/api/search", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        query: "latest news",
                        count: 8,
                        freshness: "7d",
                        summary: false,
                        deepSearch: true,
                      }),
                      cache: "no-store",
                    });
                    const contentType = res.headers.get("content-type") || "";
                    let data: any = null;
                    if (contentType.includes("application/json")) {
                      try {
                        data = await res.json();
                      } catch {
                        const t = await res.text().catch(() => "");
                        throw new Error(t ? `Invalid JSON: ${t.slice(0, 200)}` : "Empty response");
                      }
                    } else {
                      const t = await res.text().catch(() => "");
                      throw new Error(t ? t.slice(0, 200) : `Non-JSON response (${res.status})`);
                    }
                    if (!res.ok || data?.error) throw new Error(data?.error || "Failed to fetch news");
                    setItems(Array.isArray(data?.results) ? data.results : []);
                    setLastUpdated(Date.now());
                    setError(null);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : String(err));
                  } finally {
                    setLoading(false);
                  }
                })();
              }}
              aria-label="Refresh latest news"
              disabled={loading}
              aria-disabled={loading}
              className={`px-3 py-2 rounded-full bg-white/20 hover:bg-white/30 border border-white/40 text-white backdrop-blur-md shadow transition inline-flex items-center gap-2 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {loading ? (<><Loader2 size={16} className="animate-spin" /> Refreshing</>) : 'Refresh'}
            </button>
            {onBack && (
              <button
                onClick={onBack}
                ref={backBtnRef}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 border border-white/40 text-white backdrop-blur-md shadow transition focus:outline-none focus:ring-2 focus:ring-white/70"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            )}
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="status" aria-live="polite" aria-busy="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-white/30 bg-white/70 dark:bg-zinc-900/60 backdrop-blur animate-pulse"
              >
                <div className="h-5 w-2/3 bg-foreground/10 rounded mb-2" />
                <div className="h-3 w-full bg-foreground/10 rounded mb-1" />
                <div className="h-3 w-10/12 bg-foreground/10 rounded" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/15 text-red-700 dark:text-red-200" role="alert" aria-live="assertive">
            <div className="font-medium">Unable to load latest news</div>
            <div className="text-sm opacity-90 break-words">{error}</div>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="p-6 text-center text-muted-foreground">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mx-auto mb-2">
              <Newspaper size={20} />
            </div>
            <div className="font-medium">No news available right now</div>
            <div className="text-sm opacity-90">Try again in a moment or adjust your query.</div>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((r: SearchResult, i: number) => (
              <a
                key={i}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 rounded-xl border border-white/30 bg-white/90 dark:bg-zinc-900/70 backdrop-blur shadow-md hover:shadow-lg transition-shadow motion-safe:animate-[fadeInUp_0.35s_ease-out_both] focus:outline-none focus:ring-2 focus:ring-primary/40"
                style={{ animationDelay: `${i * 40}ms` }}
                aria-label={`Open ${r.title} in a new tab`}
              >
                <div className="text-lg font-semibold text-primary hover:underline">
                  {r.title}
                </div>
                {r.url && (
                  <div className="text-sm text-muted-foreground mt-1 break-all">
                    {getHost(r.url)}
                  </div>
                )}
                {r.snippet && <p className="mt-2 text-foreground leading-relaxed">{r.snippet}</p>}
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

