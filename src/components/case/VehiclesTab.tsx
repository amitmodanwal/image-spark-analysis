import { useEffect, useState } from "react";
import { Plus, Trash2, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchVehicles, createVehicle, deleteVehicle } from "@/services/case-service";
import type { VehicleRecord } from "@/types/case";

export function VehiclesTab({ caseId, onRefreshAudit }: { caseId: string; onRefreshAudit: () => void }) {
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [reg, setReg] = useState(""); const [type, setType] = useState("");
  const [makeModel, setMakeModel] = useState(""); const [color, setColor] = useState("");
  const [owner, setOwner] = useState(""); const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);

  const load = async () => { setLoading(true); try { setVehicles(await fetchVehicles(caseId)); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, [caseId]);

  const submit = async () => {
    if (!reg.trim() && !makeModel.trim()) { setError("Registration number or make/model is required."); return; }
    setBusy(true); setError(null);
    try {
      await createVehicle({ case_id: caseId, registration_number: reg.trim(), vehicle_type: type.trim(), make_model: makeModel.trim(), color: color.trim(), owner_reference: owner.trim(), notes: notes.trim() });
      setReg(""); setType(""); setMakeModel(""); setColor(""); setOwner(""); setNotes(""); setShowForm(false);
      await load(); onRefreshAudit();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to add vehicle."); }
    finally { setBusy(false); }
  };

  const remove = async (id: string) => { if (!confirm("Remove this vehicle?")) return; await deleteVehicle(caseId, id); await load(); onRefreshAudit(); };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground"><Car className="size-4 text-primary" aria-hidden /> Vehicles<span className="font-mono text-xs text-muted-foreground">({vehicles.length})</span></h3>
        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setShowForm(!showForm)}><Plus className="size-4" aria-hidden /> Add</Button>
      </div>
      {showForm && (
        <div className="glass-panel mt-4 rounded-2xl p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2"><Label>Registration number</Label><Input value={reg} onChange={(e) => setReg(e.target.value)} /></div>
            <div className="space-y-2"><Label>Vehicle type</Label><Input value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g. Car, Motorcycle" /></div>
            <div className="space-y-2"><Label>Make / Model</Label><Input value={makeModel} onChange={(e) => setMakeModel(e.target.value)} /></div>
            <div className="space-y-2"><Label>Color</Label><Input value={color} onChange={(e) => setColor(e.target.value)} /></div>
          </div>
          <div className="mt-3 space-y-2"><Label>Owner / Reference</Label><Input value={owner} onChange={(e) => setOwner(e.target.value)} /></div>
          <div className="mt-3 space-y-2"><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <div className="mt-3 flex gap-2"><Button className="bg-signal rounded-xl text-primary-foreground" disabled={busy} onClick={submit}>{busy ? "Saving…" : "Save"}</Button><Button variant="outline" className="rounded-xl" onClick={() => setShowForm(false)}>Cancel</Button></div>
        </div>
      )}
      {loading ? <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      : vehicles.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No vehicles recorded.</p>
      : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {vehicles.map((v) => (
            <div key={v.id} className="glass-panel rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  {v.registration_number && <p className="font-mono text-sm font-bold text-foreground">{v.registration_number}</p>}
                  {(v.make_model || v.vehicle_type) && <p className="mt-1 text-sm text-muted-foreground">{[v.vehicle_type, v.make_model].filter(Boolean).join(" · ")}</p>}
                  {v.color && <p className="mt-0.5 text-xs text-muted-foreground">Color: {v.color}</p>}
                  {v.owner_reference && <p className="mt-0.5 text-xs text-muted-foreground">Owner: {v.owner_reference}</p>}
                  {v.notes && <p className="mt-2 text-xs text-muted-foreground">{v.notes}</p>}
                </div>
                <Button variant="ghost" size="icon" className="shrink-0 rounded-lg text-destructive" onClick={() => remove(v.id)}><Trash2 className="size-3.5" aria-hidden /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
