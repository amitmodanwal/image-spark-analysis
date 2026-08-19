import { useEffect, useState } from "react";
import { X, Download, Trash2, MapPin, User, Calendar, FileText, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryBadge, VerificationBadge } from "@/components/CaseBadges";
import { getEvidenceSignedUrl, updateEvidenceVerification, deleteEvidence } from "@/services/case-service";
import type { EvidenceRecord, VerificationStatus, CaseEventRecord, AuditLogRecord } from "@/types/case";
import { EVIDENCE_CATEGORY_LABELS } from "@/types/case";

interface EvidenceDrawerProps {
  evidence: EvidenceRecord;
  caseId: string;
  events: CaseEventRecord[];
  auditLogs: AuditLogRecord[];
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
}

export function EvidenceDrawer({ evidence, caseId, events, auditLogs, onClose, onUpdated, onDeleted }: EvidenceDrawerProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [urlLoading, setUrlLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!evidence.file_path) return;
    setUrlLoading(true);
    getEvidenceSignedUrl(evidence.file_path).then((url) => setSignedUrl(url)).finally(() => setUrlLoading(false));
  }, [evidence.file_path]);

  const relatedEvents = events.filter(
    (e) => e.title.toLowerCase().includes(evidence.title.toLowerCase()) ||
      (evidence.evidence_date && Math.abs(new Date(e.event_date).getTime() - new Date(evidence.evidence_date).getTime()) < 86400000),
  );
  const accessHistory = auditLogs.filter((log) => log.entity_type === "evidence" && log.entity_id === evidence.id);

  const setVerification = async (status: VerificationStatus) => {
    setBusy(true); setError(null);
    try { await updateEvidenceVerification(caseId, evidence.id, status); onUpdated(); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to update verification."); }
    finally { setBusy(false); }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this evidence item? This cannot be undone.")) return;
    setBusy(true);
    try { await deleteEvidence(caseId, evidence.id, evidence.file_path); onDeleted(); onClose(); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to delete evidence."); }
    finally { setBusy(false); }
  };

  const isAudio = evidence.category === "audio_recording" || evidence.file_type.startsWith("audio/");
  const isPdf = evidence.category === "pdf" || evidence.file_type === "application/pdf";
  const isImage = evidence.category === "image" || evidence.file_type.startsWith("image/");

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="glass-panel relative z-10 flex h-full w-full max-w-xl flex-col overflow-y-auto rounded-l-3xl p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-foreground">{evidence.title}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <CategoryBadge category={evidence.category} />
              <VerificationBadge status={evidence.verification_status} />
            </div>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0 rounded-xl" onClick={onClose}>
            <X className="size-4" aria-hidden />
          </Button>
        </div>

        {evidence.file_path && (
          <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-background/40">
            {urlLoading ? (
              <div className="grid h-40 place-items-center"><Loader2 className="size-6 animate-spin text-primary" aria-hidden /></div>
            ) : signedUrl ? (
              isAudio ? (
                <div className="p-4">
                  <audio controls className="w-full"><source src={signedUrl} type={evidence.file_type || "audio/mpeg"} /></audio>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Secure audio preview — URL expires in 5 minutes</p>
                </div>
              ) : isPdf ? (
                <iframe src={signedUrl} className="h-96 w-full" title="PDF preview" />
              ) : isImage ? (
                <img src={signedUrl} alt={evidence.title} className="max-h-80 w-full object-contain" />
              ) : (
                <div className="grid h-32 place-items-center"><FileText className="size-8 text-muted-foreground" aria-hidden /></div>
              )
            ) : (
              <div className="grid h-32 place-items-center text-sm text-muted-foreground">Could not generate a preview URL.</div>
            )}
          </div>
        )}

        <div className="mt-5 space-y-3">
          {evidence.description && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Description</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/90">{evidence.description}</p>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <MetaRow icon={FileText} label="Category" value={EVIDENCE_CATEGORY_LABELS[evidence.category]} />
            <MetaRow icon={Calendar} label="Evidence date" value={evidence.evidence_date ? new Date(evidence.evidence_date).toLocaleString() : "—"} />
            <MetaRow icon={FileText} label="Source" value={evidence.source || "—"} />
            <MetaRow icon={Calendar} label="Uploaded" value={new Date(evidence.created_at).toLocaleString()} />
            <MetaRow icon={MapPin} label="Location" value={evidence.location?.name || evidence.location?.address || "—"} />
            <MetaRow icon={User} label="Related person" value={evidence.related_person_type ?? "—"} />
          </div>
          {evidence.file_name && (
            <div className="rounded-2xl border border-border bg-background/40 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">File</p>
              <p className="mt-1 text-sm text-foreground">{evidence.file_name}</p>
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">{(evidence.file_size_bytes / 1024).toFixed(1)} KB · {evidence.file_type || "unknown"}</p>
            </div>
          )}
          {evidence.notes && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Notes</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/90">{evidence.notes}</p>
            </div>
          )}
        </div>

        <div className="mt-5 rounded-2xl border border-border bg-background/40 p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-foreground">
            <ShieldCheck className="size-3.5 text-primary" aria-hidden /> Verification status
          </p>
          <div className="mt-3 flex gap-2">
            {(["pending", "verified", "rejected"] as VerificationStatus[]).map((s) => (
              <Button key={s} variant={evidence.verification_status === s ? "default" : "outline"} size="sm" className="rounded-xl capitalize" disabled={busy} onClick={() => setVerification(s)}>{s}</Button>
            ))}
          </div>
        </div>

        {relatedEvents.length > 0 && (
          <div className="mt-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Related timeline events</p>
            <ul className="mt-2 space-y-2">
              {relatedEvents.map((ev) => (
                <li key={ev.id} className="rounded-xl border border-border bg-background/30 px-3 py-2 text-sm">
                  <span className="font-medium text-foreground">{ev.title}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{new Date(ev.event_date).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Access &amp; change history</p>
          {accessHistory.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">No recorded actions yet.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {accessHistory.map((log) => (
                <li key={log.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-md border border-border bg-background/40 px-1.5 py-0.5 font-mono uppercase tracking-wider text-foreground">{log.action}</span>
                  <span>{new Date(log.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

        <div className="mt-auto flex gap-2 pt-6">
          {signedUrl && (
            <Button asChild variant="outline" className="rounded-xl">
              <a href={signedUrl} download={evidence.file_name}><Download className="size-4" aria-hidden /> Download</a>
            </Button>
          )}
          <Button variant="ghost" className="rounded-xl text-destructive" disabled={busy} onClick={handleDelete}>
            <Trash2 className="size-4" aria-hidden /> Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}
