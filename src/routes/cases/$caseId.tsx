import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Briefcase, FileText, Users, Car, MapPin, Clock, ScrollText, Trash2, Pencil, Loader2, CalendarDays, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AuthGate } from "@/components/AuthGate";
import { CaseStatusBadge } from "@/components/CaseBadges";
import { EvidenceTab } from "@/components/case/EvidenceTab";
import { PeopleTab } from "@/components/case/PeopleTab";
import { VehiclesTab } from "@/components/case/VehiclesTab";
import { LocationsTab } from "@/components/case/LocationsTab";
import { TimelineTab } from "@/components/case/TimelineTab";
import { AuditTab } from "@/components/case/AuditTab";
import { EvidenceUploadModal } from "@/components/EvidenceUploadModal";
import { EvidenceDrawer } from "@/components/EvidenceDrawer";
import { fetchCase, updateCase, deleteCase, fetchLocations, fetchSuspects, fetchVictims, fetchWitnesses, fetchCaseEvents, fetchAuditLogs, fetchEvidence, fetchVehicles } from "@/services/case-service";
import type { CaseRecord, CaseStatus, EvidenceRecord, LocationRecord, CaseEventRecord, AuditLogRecord, SuspectRecord, VictimRecord, WitnessRecord, VehicleRecord } from "@/types/case";

type TabId = "evidence" | "people" | "vehicles" | "locations" | "timeline" | "audit";

const TABS: { id: TabId; label: string; icon: typeof FileText }[] = [
  { id: "evidence", label: "Evidence", icon: FileText },
  { id: "people", label: "People", icon: Users },
  { id: "vehicles", label: "Vehicles", icon: Car },
  { id: "locations", label: "Locations", icon: MapPin },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "audit", label: "Audit", icon: ScrollText },
];

export const Route = createFileRoute("/cases/$caseId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Case Detail — Sākṣya Evidence Lens" },
      { name: "description", content: "Case evidence, people, vehicles, locations, timeline and audit history." },
    ],
  }),
  component: () => (<AuthGate><CaseDetailPage /></AuthGate>),
});

function CaseDetailPage() {
  const { caseId } = useParams({ from: "/cases/$caseId" });
  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("evidence");
  const [showEdit, setShowEdit] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editNumber, setEditNumber] = useState("");
  const [editStatus, setEditStatus] = useState<CaseStatus>("open");
  const [editDesc, setEditDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [events, setEvents] = useState<CaseEventRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [suspects, setSuspects] = useState<SuspectRecord[]>([]);
  const [victims, setVictims] = useState<VictimRecord[]>([]);
  const [witnesses, setWitnesses] = useState<WitnessRecord[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [openEvidence, setOpenEvidence] = useState<EvidenceRecord | null>(null);

  const loadShared = useCallback(async () => {
    const [locs, evs, logs, sus, vic, wit, evi, veh] = await Promise.all([
      fetchLocations(caseId), fetchCaseEvents(caseId), fetchAuditLogs(caseId),
      fetchSuspects(caseId), fetchVictims(caseId), fetchWitnesses(caseId),
      fetchEvidence(caseId), fetchVehicles(caseId),
    ]);
    setLocations(locs); setEvents(evs); setAuditLogs(logs); setSuspects(sus); setVictims(vic); setWitnesses(wit); setEvidence(evi); setVehicles(veh);
  }, [caseId]);

  const loadCase = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const c = await fetchCase(caseId);
      if (!c) { setError("Case not found."); return; }
      setCaseRecord(c); setEditTitle(c.title); setEditNumber(c.case_number); setEditStatus(c.status); setEditDesc(c.description);
      await loadShared();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load case."); }
    finally { setLoading(false); }
  }, [caseId, loadShared]);

  useEffect(() => { void loadCase(); }, [loadCase]);

  const refreshAudit = () => { void loadShared(); };

  const handleSave = async () => {
    if (!editTitle.trim()) return;
    setSaving(true);
    try { await updateCase(caseId, { title: editTitle.trim(), case_number: editNumber.trim(), status: editStatus, description: editDesc.trim() }); setShowEdit(false); await loadCase(); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to update case."); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this entire case and all its data? This cannot be undone.")) return;
    try { await deleteCase(caseId); window.location.href = "/cases"; }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to delete case."); }
  };

  if (loading) return (<div className="grid min-h-screen place-items-center"><Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden /></div>);

  if (error || !caseRecord) return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <p className="text-sm text-destructive">{error ?? "Case not found."}</p>
      <Link to="/cases" className="mt-4 inline-block text-sm text-primary underline">Back to cases</Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link to="/cases" className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" aria-hidden /> Back to cases
      </Link>

      <div className="glass-panel mt-4 rounded-3xl p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="bg-signal grid size-10 shrink-0 place-items-center rounded-2xl text-primary-foreground"><Briefcase className="size-5" aria-hidden /></span>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-foreground">{caseRecord.title}</h1>
                {caseRecord.case_number && <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{caseRecord.case_number}</p>}
              </div>
            </div>
            <div className="mt-3"><CaseStatusBadge status={caseRecord.status} /></div>
            {caseRecord.description && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{caseRecord.description}</p>}
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setShowEdit(!showEdit)}><Pencil className="size-3.5" aria-hidden /> Edit</Button>
            <Button variant="ghost" size="sm" className="rounded-xl text-destructive" onClick={handleDelete}><Trash2 className="size-3.5" aria-hidden /> Delete</Button>
          </div>
        </div>
        {showEdit && (
          <div className="mt-5 border-t border-border pt-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2"><Label>Title</Label><Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} /></div>
              <div className="space-y-2"><Label>Case number</Label><Input value={editNumber} onChange={(e) => setEditNumber(e.target.value)} /></div>
              <div className="space-y-2"><Label>Status</Label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as CaseStatus)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="open" className="bg-card">Open</option><option value="closed" className="bg-card">Closed</option><option value="archived" className="bg-card">Archived</option>
                </select>
              </div>
            </div>
            <div className="mt-3 space-y-2"><Label>Description</Label><Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2} /></div>
            <div className="mt-3 flex gap-2"><Button className="bg-signal rounded-xl text-primary-foreground" disabled={saving} onClick={handleSave}>{saving ? "Saving…" : "Save changes"}</Button><Button variant="outline" className="rounded-xl" onClick={() => setShowEdit(false)}>Cancel</Button></div>
          </div>
        )}
      </div>

      {/* Case Summary */}
      <div className="glass-panel mt-4 rounded-3xl p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border bg-card/60 text-primary">
            <ShieldCheck className="size-5" aria-hidden />
          </span>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Case overview</p>
            <h2 className="text-lg font-semibold text-foreground">Summary</h2>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <SummaryStat icon={FileText} label="Evidence" value={evidence.length} />
          <SummaryStat icon={Users} label="People" value={suspects.length + victims.length + witnesses.length} />
          <SummaryStat icon={Car} label="Vehicles" value={vehicles.length} />
          <SummaryStat icon={MapPin} label="Locations" value={locations.length} />
          <SummaryStat icon={Clock} label="Events" value={events.length} />
          <SummaryStat icon={ScrollText} label="Audit logs" value={auditLogs.length} />
        </div>

        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" aria-hidden /> Created {new Date(caseRecord.created_at).toLocaleDateString()}</span>
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-success" aria-hidden /> Status: {caseRecord.status}</span>
        </div>

        {caseRecord.description && (
          <p className="mt-4 text-sm leading-relaxed text-foreground/90">{caseRecord.description}</p>
        )}
        {!caseRecord.description && (
          <p className="mt-4 text-sm italic text-muted-foreground">No description added yet. Click "Edit" to add case details.</p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.id ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-card/40 text-muted-foreground hover:text-foreground"}`}>
              <Icon className="size-4" aria-hidden /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="glass-panel mt-4 rounded-3xl p-6">
        {activeTab === "evidence" && <EvidenceTab caseId={caseId} onOpenEvidence={(ev) => setOpenEvidence(ev)} onUploadClick={() => setShowUpload(true)} onRefreshAudit={refreshAudit} />}
        {activeTab === "people" && <PeopleTab caseId={caseId} onRefreshAudit={refreshAudit} />}
        {activeTab === "vehicles" && <VehiclesTab caseId={caseId} onRefreshAudit={refreshAudit} />}
        {activeTab === "locations" && <LocationsTab caseId={caseId} onRefreshAudit={refreshAudit} />}
        {activeTab === "timeline" && <TimelineTab caseId={caseId} locations={locations} onRefreshAudit={refreshAudit} />}
        {activeTab === "audit" && <AuditTab caseId={caseId} />}
      </div>

      {showUpload && (
        <EvidenceUploadModal caseId={caseId} locations={locations} suspects={suspects.map((s) => ({ id: s.id, name: s.name }))} victims={victims.map((v) => ({ id: v.id, name: v.name }))} witnesses={witnesses.map((w) => ({ id: w.id, name: w.name }))} onClose={() => setShowUpload(false)} onUploaded={() => refreshAudit()} />
      )}

      {openEvidence && (
        <EvidenceDrawer evidence={openEvidence} caseId={caseId} events={events} auditLogs={auditLogs} onClose={() => setOpenEvidence(null)} onUpdated={() => { void loadCase(); }} onDeleted={() => { void loadCase(); }} />
      )}
    </div>
  );
}

function SummaryStat({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 px-3 py-3 text-center">
      <Icon className="mx-auto size-4 text-primary" aria-hidden />
      <p className="mt-1.5 font-mono text-lg font-bold tabular-nums text-foreground">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
