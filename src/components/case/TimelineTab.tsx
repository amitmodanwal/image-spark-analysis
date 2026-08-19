import { useEffect, useState } from "react";
import { Plus, Trash2, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchCaseEvents, createCaseEvent, deleteCaseEvent } from "@/services/case-service";
import type { CaseEventRecord, LocationRecord } from "@/types/case";

export function TimelineTab({ caseId, locations, onRefreshAudit }: { caseId: string; locations: LocationRecord[]; onRefreshAudit: () => void }) {
  const [events, setEvents] = useState<CaseEventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState(""); const [desc, setDesc] = useState("");
  const [date, setDate] = useState(""); const [locId, setLocId] = useState("");
  const [type, setType] = useState("general");
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);

  const load = async () => { setLoading(true); try { setEvents(await fetchCaseEvents(caseId)); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, [caseId]);

  const submit = async () => {
    if (!title.trim() || !date) { setError("Title and date are required."); return; }
    setBusy(true); setError(null);
    try {
      await createCaseEvent({ case_id: caseId, title: title.trim(), description: desc.trim(), event_date: new Date(date).toISOString(), location_id: locId || null, event_type: type.trim() });
      setTitle(""); setDesc(""); setDate(""); setLocId(""); setType("general"); setShowForm(false);
      await load(); onRefreshAudit();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to add event."); }
    finally { setBusy(false); }
  };

  const remove = async (id: string) => { if (!confirm("Remove this event?")) return; await deleteCaseEvent(caseId, id); await load(); onRefreshAudit(); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground"><Clock className="size-4 text-primary" aria-hidden /> Case Timeline<span className="font-mono text-xs text-muted-foreground">({events.length})</span></h3>
        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setShowForm(!showForm)}><Plus className="size-4" aria-hidden /> Add event</Button>
      </div>
      {showForm && (
        <div className="glass-panel rounded-2xl p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2"><Label>Event title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div className="space-y-2"><Label>Date / time *</Label><Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="space-y-2"><Label>Event type</Label><Input value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g. FIR, interview, raid" /></div>
            <div className="space-y-2"><Label>Location</Label>
              <select value={locId} onChange={(e) => setLocId(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="" className="bg-card">None</option>
                {locations.map((loc) => (<option key={loc.id} value={loc.id} className="bg-card">{loc.name || loc.address}</option>))}
              </select>
            </div>
          </div>
          <div className="mt-3 space-y-2"><Label>Description</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} /></div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <div className="mt-3 flex gap-2"><Button className="bg-signal rounded-xl text-primary-foreground" disabled={busy} onClick={submit}>{busy ? "Saving…" : "Save"}</Button><Button variant="outline" className="rounded-xl" onClick={() => setShowForm(false)}>Cancel</Button></div>
        </div>
      )}
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p>
      : events.length === 0 ? <p className="text-sm text-muted-foreground">No timeline events yet. Add events to build the case chronology.</p>
      : (
        <div className="relative">
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border" aria-hidden />
          <ol className="space-y-4">
            {events.map((ev) => (
              <li key={ev.id} className="relative flex gap-4">
                <div className="z-10 mt-1 grid size-10 shrink-0 place-items-center rounded-full border border-border bg-card text-primary"><Calendar className="size-4" aria-hidden /></div>
                <div className="glass-panel flex-1 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{ev.title}</p>
                      <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{new Date(ev.event_date).toLocaleString()}{ev.event_type && ev.event_type !== "general" && ` · ${ev.event_type}`}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0 rounded-lg text-destructive" onClick={() => remove(ev.id)}><Trash2 className="size-3.5" aria-hidden /></Button>
                  </div>
                  {ev.description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ev.description}</p>}
                  {ev.location && <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="size-3" aria-hidden /> {ev.location.name || ev.location.address}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
