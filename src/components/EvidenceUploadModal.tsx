import { useRef, useState } from "react";
import { CloudUpload, FileText, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { validateEvidenceFile, fileCategoryFromType, uploadEvidenceItem } from "@/services/case-service";
import type { EvidenceCategory, LocationRecord, PersonType } from "@/types/case";
import { EVIDENCE_CATEGORY_LABELS } from "@/types/case";

const CATEGORIES = Object.entries(EVIDENCE_CATEGORY_LABELS) as [EvidenceCategory, string][];

interface UploadModalProps {
  caseId: string;
  locations: LocationRecord[];
  suspects: { id: string; name: string }[];
  victims: { id: string; name: string }[];
  witnesses: { id: string; name: string }[];
  onClose: () => void;
  onUploaded: () => void;
}

export function EvidenceUploadModal({ caseId, locations, suspects, victims, witnesses, onClose, onUploaded }: UploadModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<EvidenceCategory>("other");
  const [source, setSource] = useState("");
  const [evidenceDate, setEvidenceDate] = useState("");
  const [locationId, setLocationId] = useState("");
  const [personType, setPersonType] = useState<PersonType | "">("");
  const [personId, setPersonId] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (f: File | null) => {
    if (!f) return;
    const validationError = validateEvidenceFile(f);
    if (validationError) { setError(validationError); return; }
    setError(null);
    setFile(f);
    setCategory(fileCategoryFromType(f));
    if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  const personOptions = personType === "suspect" ? suspects : personType === "victim" ? victims : personType === "witness" ? witnesses : [];

  const submit = async () => {
    if (!title.trim()) { setError("Please provide a title."); return; }
    setBusy(true);
    setError(null);
    try {
      await uploadEvidenceItem({
        case_id: caseId, title: title.trim(), description: description.trim(), category,
        source: source.trim(), evidence_date: evidenceDate ? new Date(evidenceDate).toISOString() : null,
        location_id: locationId || null, related_person_type: (personType || null) as PersonType | null,
        related_person_id: personId || null, notes: notes.trim(), file,
      });
      onUploaded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="glass-panel relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Upload Evidence</h2>
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={onClose}>
            <X className="size-4" aria-hidden />
          </Button>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0] ?? null); }}
          className={`mt-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-colors ${dragging ? "border-primary bg-primary/5" : "border-border bg-background/30"}`}
        >
          {file ? (
            <div className="text-center">
              <FileText className="mx-auto size-8 text-primary" aria-hidden />
              <p className="mt-2 text-sm font-medium text-foreground">{file.name}</p>
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB · {file.type || "unknown type"}
              </p>
              <Button variant="ghost" size="sm" className="mt-2 rounded-xl" onClick={() => setFile(null)}>Remove file</Button>
            </div>
          ) : (
            <div className="text-center">
              <CloudUpload className="mx-auto size-8 text-muted-foreground" aria-hidden />
              <p className="mt-2 text-sm font-medium text-foreground">Drag &amp; drop a file here</p>
              <p className="mt-1 text-xs text-muted-foreground">Audio, PDF, documents, images — max 50 MB</p>
              <Button variant="secondary" size="sm" className="mt-3 rounded-xl" onClick={() => fileRef.current?.click()}>Browse files</Button>
            </div>
          )}
          <input ref={fileRef} type="file" className="hidden"
            accept="audio/*,application/pdf,.pdf,.doc,.docx,.txt,.csv,image/jpeg,image/png,image/webp"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
        </div>

        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ev-title">Evidence title *</Label>
            <Input id="ev-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ev-desc">Description</Label>
            <Textarea id="ev-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ev-cat">Category</Label>
              <select id="ev-cat" value={category} onChange={(e) => setCategory(e.target.value as EvidenceCategory)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                {CATEGORIES.map(([val, label]) => (<option key={val} value={val} className="bg-card">{label}</option>))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-source">Source</Label>
              <Input id="ev-source" value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. Scene visit" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ev-date">Evidence date/time</Label>
              <Input id="ev-date" type="datetime-local" value={evidenceDate} onChange={(e) => setEvidenceDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-loc">Related location</Label>
              <select id="ev-loc" value={locationId} onChange={(e) => setLocationId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="" className="bg-card">None</option>
                {locations.map((loc) => (<option key={loc.id} value={loc.id} className="bg-card">{loc.name || loc.address}</option>))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ev-ptype">Related person type</Label>
              <select id="ev-ptype" value={personType}
                onChange={(e) => { setPersonType(e.target.value as PersonType | ""); setPersonId(""); }}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="" className="bg-card">None</option>
                <option value="suspect" className="bg-card">Suspect</option>
                <option value="victim" className="bg-card">Victim</option>
                <option value="witness" className="bg-card">Witness</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-pid">Related person</Label>
              <select id="ev-pid" value={personId} onChange={(e) => setPersonId(e.target.value)} disabled={!personType}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50">
                <option value="" className="bg-card">None</option>
                {personOptions.map((p) => (<option key={p.id} value={p.id} className="bg-card">{p.name}</option>))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ev-notes">Notes</Label>
            <Textarea id="ev-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          {error && <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" className="rounded-xl" onClick={onClose} disabled={busy}>Cancel</Button>
            <Button className="bg-signal rounded-xl text-primary-foreground" disabled={busy} onClick={submit}>
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {busy ? "Uploading…" : "Upload evidence"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
