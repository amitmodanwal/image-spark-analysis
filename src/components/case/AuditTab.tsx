import { useEffect, useState } from "react";
import { ScrollText, Plus, Trash2, Eye, Pencil, FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchAuditLogs, createCaseEvent } from "@/services/case-service";
import type { AuditLogRecord } from "@/types/case";

const ACTION_ICONS: Record<string, typeof Eye> = { create: FilePlus, update: Pencil, delete: Trash2, view: Eye };

export function AuditTab({ caseId }: { caseId: string }) {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventTitle, setEventTitle] = useState(""); const [eventDate, setEventDate] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);

  const load = async () => { setLoading(true); try { setLogs(await fetchAuditLogs(caseId)); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, [caseId]);

  const addManualEvent = async () => {
    if (!eventTitle.trim() || !eventDate) { setError("Title and date are required."); return; }
    setBusy(true); setError(null);
    try { await createCaseEvent({ case_id: caseId, title: eventTitle.trim(), event_date: new Date(eventDate).toISOString(), event_type: "manual_log" }); setEventTitle(""); setEventDate(""); setShowEventForm(false); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to add event."); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground"><ScrollText className="size-4 text-primary" aria-hidden /> Audit History<span className="font-mono text-xs text-muted-foreground">({logs.length})</span></h3>
        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setShowEventForm(!showEventForm)}><Plus className="size-4" aria-hidden /> Log event</Button>
      </div>
      <p className="rounded-2xl border border-border bg-background/40 px-4 py-3 text-xs text-muted-foreground">Every create, update, and delete on this case is recorded here automatically. Audit logs are tamper-evident and cannot be edited or deleted.</p>
      {showEventForm && (
        <div className="glass-panel rounded-2xl p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2"><Label>Event title *</Label><Input value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} /></div>
            <div className="space-y-2"><Label>Date / time *</Label><Input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} /></div>
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <div className="mt-3 flex gap-2"><Button className="bg-signal rounded-xl text-primary-foreground" disabled={busy} onClick={addManualEvent}>{busy ? "Saving…" : "Save"}</Button><Button variant="outline" className="rounded-xl" onClick={() => setShowEventForm(false)}>Cancel</Button></div>
        </div>
      )}
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p>
      : logs.length === 0 ? <p className="text-sm text-muted-foreground">No audit entries yet.</p>
      : (
        <div className="space-y-2">
          {logs.map((log) => {
            const Icon = ACTION_ICONS[log.action] ?? Eye;
            return (
              <div key={log.id} className="flex items-start gap-3 rounded-xl border border-border bg-background/30 px-4 py-3">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border border-border bg-card/60 text-primary"><Icon className="size-3.5" aria-hidden /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground"><span className="font-mono uppercase tracking-wider text-primary">{log.action}</span> <span className="text-muted-foreground">on</span> <span className="font-medium">{log.entity_type.replace(/_/g, " ")}</span></p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{new Date(log.created_at).toLocaleString()}</p>
                  {Object.keys(log.details).length > 0 && <p className="mt-1 font-mono text-[11px] text-muted-foreground/70">{JSON.stringify(log.details)}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
