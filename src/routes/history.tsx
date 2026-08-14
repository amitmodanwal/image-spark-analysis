import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, History, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase, supabaseConfigured, type AnalysisRecord } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { SummaryCard } from "@/components/SummaryCard";
import type { Analysis } from "@/types/analysis";
import { AuthGate } from "@/components/AuthGate";


const title = "Analysis history — EvidenceLens AI";
const description = "Revisit your saved image relationship analyses and investigation summaries.";

export const Route = createFileRoute("/history")({
  ssr: false,
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AuthGate>
      <HistoryPage />
    </AuthGate>
  ),
});


function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    void (async () => {
      const { data, error: err } = await supabase
        .from("analyses")
        .select("*")
        .order("created_at", { ascending: false });
      if (err) setError(err.message);
      else setRows((data ?? []) as AnalysisRecord[]);
      setLoading(false);
    })();
  }, [user, authLoading]);

  const remove = async (id: string) => {
    const { error: err } = await supabase.from("analyses").delete().eq("id", id);
    if (err) setError(err.message);
    else setRows((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Link
        to="/"
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to dashboard
      </Link>

      <div className="mt-6 flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border bg-card/60 text-primary">
          <History className="size-5" aria-hidden />
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Analysis history</h1>
      </div>

      {!supabaseConfigured && (
        <p className="mt-6 text-sm text-muted-foreground">Supabase is not configured yet.</p>
      )}

      {supabaseConfigured && !authLoading && !user && (
        <p className="mt-6 text-sm text-muted-foreground">
          <Link to="/auth" className="text-primary underline">
            Sign in
          </Link>{" "}
          to see your saved analyses.
        </p>
      )}

      {error && <p className="mt-6 text-sm text-destructive">{error}</p>}

      {user && loading && <p className="mt-6 text-sm text-muted-foreground">Loading…</p>}

      {user && !loading && rows.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">No saved analyses yet.</p>
      )}

      <div className="mt-8 space-y-4">
        {rows.map((row) => (
          <div key={row.id} className="glass-panel rounded-3xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {row.title || `${row.image_urls.length} images`}
                </p>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {new Date(row.created_at).toLocaleString()} ·{" "}
                  {Math.round((row.confidence ?? 0) * 100)}% confidence
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setOpenId(openId === row.id ? null : row.id)}
                >
                  {openId === row.id ? "Hide" : "View"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl text-destructive"
                  onClick={() => remove(row.id)}
                  aria-label="Delete analysis"
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
            </div>

            {openId === row.id && (
              <div className="mt-5 space-y-4">
                <div className="flex flex-wrap gap-3">
                  {row.image_urls.map((url) => (
                    <img
                      key={url}
                      src={url}
                      alt="Saved evidence image"
                      loading="lazy"
                      className="size-24 rounded-2xl border border-border object-cover"
                    />
                  ))}
                </div>
                <SummaryCard
                  summary={(row.analysis as Analysis).summary}
                  confidence={(row.analysis as Analysis).confidence}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
