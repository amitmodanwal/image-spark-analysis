import { useEffect, useState } from "react";
import { Plus, Trash2, Shield, Heart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchSuspects, createSuspect, deleteSuspect, fetchVictims, createVictim, deleteVictim, fetchWitnesses, createWitness, deleteWitness } from "@/services/case-service";
import type { SuspectRecord, VictimRecord, WitnessRecord } from "@/types/case";

interface PeopleTabProps { caseId: string; onRefreshAudit: () => void; }

export function PeopleTab({ caseId, onRefreshAudit }: PeopleTabProps) {
  const [suspects, setSuspects] = useState<SuspectRecord[]>([]);
  const [victims, setVictims] = useState<VictimRecord[]>([]);
  const [witnesses, setWitnesses] = useState<WitnessRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [s, v, w] = await Promise.all([fetchSuspects(caseId), fetchVictims(caseId), fetchWitnesses(caseId)]);
      setSuspects(s); setVictims(v); setWitnesses(w);
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [caseId]);

  return (
    <div className="space-y-8">
      <PersonSection title="Suspects" icon={Shield} caseId={caseId} loading={loading}
        records={suspects} onRefresh={() => { void load(); onRefreshAudit(); }}
        onCreate={(input) => createSuspect({ case_id: caseId, ...input })} onDelete={(id) => deleteSuspect(caseId, id)} fields={["name", "contact", "id_reference", "notes"]} />
      <PersonSection title="Victims" icon={Heart} caseId={caseId} loading={loading}
        records={victims} onRefresh={() => { void load(); onRefreshAudit(); }}
        onCreate={(input) => createVictim({ case_id: caseId, ...input })} onDelete={(id) => deleteVictim(caseId, id)} fields={["name", "contact", "id_reference", "notes"]} />
      <PersonSection title="Witnesses" icon={Eye} caseId={caseId} loading={loading}
        records={witnesses} onRefresh={() => { void load(); onRefreshAudit(); }}
        onCreate={(input) => createWitness({ case_id: caseId, ...input })} onDelete={(id) => deleteWitness(caseId, id)} fields={["name", "contact", "statement", "statement_date", "notes"]} isWitness />
    </div>
  );
}

interface PersonSectionProps {
  title: string; icon: typeof Shield; caseId: string;
  records: (SuspectRecord | VictimRecord | WitnessRecord)[]; loading: boolean;
  onRefresh: () => void; onCreate: (input: Record<string, string>) => Promise<unknown>;
  onDelete: (id: string) => Promise<void>; fields: string[]; isWitness?: boolean;
}

function PersonSection({ title, icon: Icon, records, loading, onRefresh, onCreate, onDelete, isWitness }: PersonSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(""); const [contact, setContact] = useState("");
  const [idRef, setIdRef] = useState(""); const [statement, setStatement] = useState("");
  const [statementDate, setStatementDate] = useState(""); const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);

  const reset = () => { setName(""); setContact(""); setIdRef(""); setStatement(""); setStatementDate(""); setNotes(""); setShowForm(false); setError(null); };

  const submit = async () => {
    if (!name.trim()) { setError("Name is required."); return; }
    setBusy(true); setError(null);
    try {
      if (isWitness) { await onCreate({ name: name.trim(), contact: contact.trim(), statement: statement.trim(), statement_date: statementDate || "", notes: notes.trim() }); }
      else { await onCreate({ name: name.trim(), contact: contact.trim(), id_reference: idRef.trim(), notes: notes.trim() }); }
      reset(); onRefresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to add record."); }
    finally { setBusy(false); }
  };

  const remove = async (id: string) => { if (!confirm("Remove this record?")) return; await onDelete(id); onRefresh(); };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground"><Icon className="size-4 text-primary" aria-hidden /> {title}<span className="font-mono text-xs text-muted-foreground">({records.length})</span></h3>
        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setShowForm(!showForm)}><Plus className="size-4" aria-hidden /> Add</Button>
      </div>
      {showForm && (
        <div className="glass-panel mt-4 rounded-2xl p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2"><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Contact</Label><Input value={contact} onChange={(e) => setContact(e.target.value)} /></div>
            {!isWitness && <div className="space-y-2"><Label>ID / Reference number</Label><Input value={idRef} onChange={(e) => setIdRef(e.target.value)} /></div>}
            {isWitness && <div className="space-y-2"><Label>Statement date</Label><Input type="date" value={statementDate} onChange={(e) => setStatementDate(e.target.value)} /></div>}
          </div>
          {isWitness && <div className="mt-3 space-y-2"><Label>Statement</Label><Textarea value={statement} onChange={(e) => setStatement(e.target.value)} rows={3} /></div>}
          <div className="mt-3 space-y-2"><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <div className="mt-3 flex gap-2">
            <Button className="bg-signal rounded-xl text-primary-foreground" disabled={busy} onClick={submit}>{busy ? "Saving…" : "Save"}</Button>
            <Button variant="outline" className="rounded-xl" onClick={reset}>Cancel</Button>
          </div>
        </div>
      )}
      {loading ? <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      : records.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No records yet.</p>
      : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {records.map((r) => (
            <div key={r.id} className="glass-panel rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{r.name}</p>
                  {"contact" in r && r.contact && <p className="mt-1 text-xs text-muted-foreground">{r.contact}</p>}
                  {"id_reference" in r && r.id_reference && <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">ID: {r.id_reference}</p>}
                  {"statement" in r && r.statement && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{r.statement}</p>}
                  {"statement_date" in r && r.statement_date && <p className="mt-1 font-mono text-[11px] text-muted-foreground">Statement: {new Date(r.statement_date).toLocaleDateString()}</p>}
                  {r.notes && <p className="mt-2 text-xs text-muted-foreground">{r.notes}</p>}
                </div>
                <Button variant="ghost" size="icon" className="shrink-0 rounded-lg text-destructive" onClick={() => remove(r.id)}><Trash2 className="size-3.5" aria-hidden /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
