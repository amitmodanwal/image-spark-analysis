import { useEffect, useMemo, useState } from "react";
import { FileText, FileAudio, FileImage, File, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryBadge, VerificationBadge } from "@/components/CaseBadges";
import { fetchEvidence, deleteEvidence } from "@/services/case-service";
import type { EvidenceRecord, EvidenceCategory } from "@/types/case";
import { EVIDENCE_CATEGORY_LABELS } from "@/types/case";

const CATEGORY_ICONS: Record<EvidenceCategory, typeof FileText> = {
  audio_recording: FileAudio, pdf: FileText, document: FileText, witness_statement: FileText,
  fir_report: FileText, call_record: FileText, image: FileImage, other: File,
};

interface EvidenceTabProps {
  caseId: string;
  onOpenEvidence: (e: EvidenceRecord) => void;
  onUploadClick: () => void;
  onRefreshAudit: () => void;
}

export function EvidenceTab({ caseId, onOpenEvidence, onUploadClick, onRefreshAudit }: EvidenceTabProps) {
  const [items, setItems] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<EvidenceCategory | "">("");
  const [filterPerson, setFilterPerson] = useState("");

  const load = async () => {
    setLoading(true);
    try { setItems(await fetchEvidence(caseId)); } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [caseId]);

  const filtered = useMemo(() => {
    let result = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.source.toLowerCase().includes(q));
    }
    if (filterCat) result = result.filter((e) => e.category === filterCat);
    if (filterPerson) result = result.filter((e) => e.related_person_type === filterPerson);
    return result;
  }, [items, search, filterCat, filterPerson]);

  const remove = async (item: EvidenceRecord) => {
    if (!confirm("Delete this evidence item? This cannot be undone.")) return;
    await deleteEvidence(caseId, item.id, item.file_path);
    await load();
    onRefreshAudit();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">Evidence Items<span className="ml-2 font-mono text-xs text-muted-foreground">({items.length})</span></h3>
        <Button className="bg-signal rounded-xl text-primary-foreground" onClick={onUploadClick}><Plus className="size-4" aria-hidden /> Upload evidence</Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input placeholder="Search evidence…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value as EvidenceCategory | "")}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          <option value="" className="bg-card">All types</option>
          {(Object.entries(EVIDENCE_CATEGORY_LABELS) as [EvidenceCategory, string][]).map(([val, label]) => (<option key={val} value={val} className="bg-card">{label}</option>))}
        </select>
        <select value={filterPerson} onChange={(e) => setFilterPerson(e.target.value)}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          <option value="" className="bg-card">All people</option>
          <option value="suspect" className="bg-card">Suspect</option>
          <option value="victim" className="bg-card">Victim</option>
          <option value="witness" className="bg-card">Witness</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading evidence…</p>
      ) : filtered.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center">
          <FileText className="mx-auto size-8 text-muted-foreground" aria-hidden />
          <p className="mt-3 text-sm text-muted-foreground">{items.length === 0 ? "No evidence uploaded yet." : "No evidence matches your filters."}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((item) => {
            const Icon = CATEGORY_ICONS[item.category] ?? File;
            return (
              <div key={item.id} className="glass-panel hover-lift cursor-pointer rounded-2xl p-4" onClick={() => onOpenEvidence(item)}>
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-card/60 text-primary"><Icon className="size-5" aria-hidden /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{item.title}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5"><CategoryBadge category={item.category} /><VerificationBadge status={item.verification_status} /></div>
                    {item.description && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {item.source && <span>Source: {item.source}</span>}
                      {item.evidence_date && <span>{new Date(item.evidence_date).toLocaleDateString()}</span>}
                      {item.location?.name && <span>Location: {item.location.name}</span>}
                      {item.related_person_type && <span>Person: {item.related_person_type}</span>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0 rounded-lg text-destructive" onClick={(e) => { e.stopPropagation(); void remove(item); }}>
                    <Trash2 className="size-3.5" aria-hidden />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
