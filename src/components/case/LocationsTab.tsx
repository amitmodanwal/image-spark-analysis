import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchLocations, createLocation, deleteLocation } from "@/services/case-service";
import type { LocationRecord } from "@/types/case";

export function LocationsTab({ caseId, onRefreshAudit }: { caseId: string; onRefreshAudit: () => void }) {
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(""); const [address, setAddress] = useState("");
  const [lat, setLat] = useState(""); const [lng, setLng] = useState("");
  const [dateTime, setDateTime] = useState(""); const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);

  const load = async () => { setLoading(true); try { setLocations(await fetchLocations(caseId)); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, [caseId]);

  useEffect(() => {
    let mounted = true;
    const initMap = async () => {
      if (typeof window === "undefined" || !mapRef.current || mapInstanceRef.current) return;
      const L = await import("leaflet");
      if (!mounted || !mapRef.current) return;
      const map = L.map(mapRef.current).setView([19.076, 72.8777], 4);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
      mapInstanceRef.current = map;
    };
    void initMap();
    return () => { mounted = false; if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || locations.length === 0) return;
    const Lmap = mapInstanceRef.current;
    locations.forEach((loc) => {
      if (loc.latitude != null && loc.longitude != null) {
        import("leaflet").then((L) => { L.marker([loc.latitude!, loc.longitude!]).addTo(Lmap).bindPopup(`<strong>${loc.name || "Location"}</strong><br/>${loc.address || ""}`); });
      }
    });
  }, [locations]);

  const submit = async () => {
    if (!name.trim() && !address.trim()) { setError("Name or address is required."); return; }
    setBusy(true); setError(null);
    try {
      await createLocation({ case_id: caseId, name: name.trim(), address: address.trim(), latitude: lat ? parseFloat(lat) : null, longitude: lng ? parseFloat(lng) : null, date_time: dateTime ? new Date(dateTime).toISOString() : null, notes: notes.trim() });
      setName(""); setAddress(""); setLat(""); setLng(""); setDateTime(""); setNotes(""); setShowForm(false);
      await load(); onRefreshAudit();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to add location."); }
    finally { setBusy(false); }
  };

  const remove = async (id: string) => { if (!confirm("Remove this location?")) return; await deleteLocation(caseId, id); await load(); onRefreshAudit(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground"><MapPin className="size-4 text-primary" aria-hidden /> Locations<span className="font-mono text-xs text-muted-foreground">({locations.length})</span></h3>
        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setShowForm(!showForm)}><Plus className="size-4" aria-hidden /> Add</Button>
      </div>
      {showForm && (
        <div className="glass-panel rounded-2xl p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Crime scene" /></div>
            <div className="space-y-2"><Label>Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
            <div className="space-y-2"><Label>Latitude</Label><Input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} /></div>
            <div className="space-y-2"><Label>Longitude</Label><Input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} /></div>
            <div className="space-y-2"><Label>Date / time</Label><Input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} /></div>
          </div>
          <div className="mt-3 space-y-2"><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <div className="mt-3 flex gap-2"><Button className="bg-signal rounded-xl text-primary-foreground" disabled={busy} onClick={submit}>{busy ? "Saving…" : "Save"}</Button><Button variant="outline" className="rounded-xl" onClick={() => setShowForm(false)}>Cancel</Button></div>
        </div>
      )}
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p>
      : locations.length === 0 ? <p className="text-sm text-muted-foreground">No locations recorded.</p>
      : (
        <div className="grid gap-3 sm:grid-cols-2">
          {locations.map((loc) => (
            <div key={loc.id} className="glass-panel rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{loc.name || loc.address || "Unnamed location"}</p>
                  {loc.address && <p className="mt-1 text-xs text-muted-foreground">{loc.address}</p>}
                  {loc.latitude != null && loc.longitude != null && <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}</p>}
                  {loc.date_time && <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{new Date(loc.date_time).toLocaleString()}</p>}
                  {loc.notes && <p className="mt-2 text-xs text-muted-foreground">{loc.notes}</p>}
                </div>
                <Button variant="ghost" size="icon" className="shrink-0 rounded-lg text-destructive" onClick={() => remove(loc.id)}><Trash2 className="size-3.5" aria-hidden /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="glass-panel overflow-hidden rounded-2xl">
        <div ref={mapRef} className="h-80 w-full" />
        <p className="px-4 py-2 text-xs text-muted-foreground">Locations with coordinates appear on the map. Case location data is only visible to authorized users.</p>
      </div>
    </div>
  );
}
