"use client";
import { useEffect, useState } from "react";

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export default function LatestNews({ onBack }: { onBack?: () => void }) {
  const [items, setItems] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        });
        const data = await res.json();
        if (!res.ok || data?.error) throw new Error(data?.error || "Failed to fetch news");
        if (isMounted) setItems(Array.isArray(data?.results) ? data.results : []);
      } catch (e) {
        if (isMounted) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchNews();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="min-h-[60vh] pb-10">
      <div className="relative p-6 rounded-2xl border bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl shadow-xl border-white/20 ring-1 ring-black/5 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 rounded-2xl [mask-image:radial-gradient(70%_70%_at_50%_0%,black,transparent)] bg-gradient-to-b from-primary/10 to-transparent" />
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold text-foreground">📰 Latest News</h2>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 border border-white/40 text-white backdrop-blur-md shadow transition"
            >
              Back
            </button>
          )}
        </div>

        {loading && (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 w-40 bg-foreground/10 rounded" />
            <div className="h-3 w-full bg-foreground/10 rounded" />
            <div className="h-3 w-11/12 bg-foreground/10 rounded" />
            <div className="h-3 w-10/12 bg-foreground/10 rounded" />
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((r: SearchResult, i: number) => (
              <div key={i} className="p-4 rounded-xl border border-white/20 bg-white/80 dark:bg-zinc-900/60 backdrop-blur shadow-md hover:shadow-lg transition-shadow">
                <a href={r.url} target="_blank" rel="noreferrer" className="text-lg font-semibold text-primary hover:underline">
                  {r.title}
                </a>
                {r.url && <div className="text-sm text-muted-foreground mt-1 break-all">{r.url}</div>}
                {r.snippet && <p className="mt-2 text-foreground">{r.snippet}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
