import { createFileRoute, Link } from "@tanstack/react-router";
import { FolderOpen, Plus, Search, Users, Car, FileText, ArrowRight, Briefcase } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthGate } from "@/components/AuthGate";
import { CaseStatusBadge } from "@/components/CaseBadges";
import { fetchCases, createCase } from "@/services/case-service";
import type { CaseWithCounts } from "@/types/case";

const title = "Cases — Sākṣya Evidence Lens";
const description = "Manage your investigation cases, evidence, people, vehicles and locations.";

export const Route = createFileRoute("/cases/")({
  ssr: false,
  head: () => ({
    meta: [
      { title }, { name: "description", content: description },
      { property: "og:title", content: title }, { property: "og:description", content: description },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (<AuthGate><CasesPage /></AuthGate>),
});

function CasesPage() {
  const [cases, setCases] = useState<CaseWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newNumber, setNewNumber] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setCases(await fetchCases()); } catch (err) { setError(err instanceof Error ? err.message : "Failed to load cases."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return cases;
    const q = search.toLowerCase();
    return cases.filter((c) => c.title.toLowerCase().includes(q) || c.case_number.toLowerCase().includes(q) || c.status.toLowerCase().includes(q));
  }, [cases, search]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try { await createCase({ title: newTitle.trim(), case_number: newNumber.trim() }); setNewTitle(""); setNewNumber(""); setShowNew(false); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to create case."); }
    finally { setCreating(false); }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="bg-signal grid size-10 shrink-0 place-items-center rounded-2xl text-primary-foreground"><Briefcase className="size-5" aria-hidden /></span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Investigation Cases</h1>
            <p className="text-sm text-muted-foreground">Manage evidence, people, vehicles, locations and timelines per case.</p>
          </div>
        </div>
        <Button className="bg-signal rounded-xl font-semibold text-primary-foreground" onClick={() => setShowNew(!showNew)}><Plus className="size-4" aria-hidden /> New Case</Button>
      </div>

      {showNew && (
        <div className="glass-panel mt-6 rounded-3xl p-5">
          <h2 className="text-sm font-semibold text-foreground">Create a new case</h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Input placeholder="Case title (e.g. Investigation #2026-001)" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="sm:flex-1" />
            <Input placeholder="Case number (optional)" value={newNumber} onChange={(e) => setNewNumber(e.target.value)} className="sm:w-48" />
            <Button className="bg-signal rounded-xl text-primary-foreground" disabled={creating || !newTitle.trim()} onClick={handleCreate}>{creating ? "Creating…" : "Create"}</Button>
          </div>
        </div>
      )}

      <div className="mt-6 relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input placeholder="Search by title, case number or status…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {error && <p className="mt-5 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
      {loading && <p className="mt-6 text-sm text-muted-foreground">Loading cases…</p>}

      {!loading && filtered.length === 0 && (
        <div className="glass-panel mt-6 rounded-3xl p-12 text-center">
          <FolderOpen className="mx-auto size-10 text-muted-foreground" aria-hidden />
          <p className="mt-4 text-sm text-muted-foreground">{cases.length === 0 ? "No cases yet. Create your first investigation case to get started." : "No cases match your search."}</p>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <Link key={c.id} to="/cases/$caseId" params={{ caseId: c.id }} className="glass-panel hover-lift group block rounded-3xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-foreground">{c.title}</p>
                {c.case_number && <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{c.case_number}</p>}
              </div>
              <CaseStatusBadge status={c.status} />
            </div>
            {c.description && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <Stat icon={FileText} label="Evidence" value={c.evidence_count ?? 0} />
              <Stat icon={Users} label="People" value={(c.suspects_count ?? 0) + (c.victims_count ?? 0) + (c.witnesses_count ?? 0)} />
              <Stat icon={Car} label="Vehicles" value={c.vehicles_count ?? 0} />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-transform group-hover:translate-x-0.5">Open case <ArrowRight className="size-3.5" aria-hidden /></span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 px-2 py-2">
      <Icon className="mx-auto size-4 text-primary" aria-hidden />
      <p className="mt-1 font-mono text-sm font-bold tabular-nums text-foreground">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
