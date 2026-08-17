import { useEffect, useRef, useState } from "react";
import { MapPin, Search, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DEMO = {
  country: "India",
  region: "Maharashtra",
  city: "Mumbai",
  category: "Demo Mobile Data",
  coords: [19.076, 72.8777] as [number, number],
};

const POPUP_LABEL = "Demo Region — Maharashtra";

type Result = typeof DEMO;

export function RegionalDataDemo() {
  const [input, setInput] = useState("+91 98765 43210");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    let mounted = true;

    const initMap = async () => {
      if (typeof window === "undefined" || !mapRef.current || mapInstanceRef.current) return;
      const L = await import("leaflet");
      if (!mounted || !mapRef.current) return;

      const map = L.map(mapRef.current).setView(DEMO.coords, 11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      L.marker(DEMO.coords).addTo(map).bindPopup(POPUP_LABEL).openPopup();

      mapInstanceRef.current = map;
    };

    void initMap();

    return () => {
      mounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [result]);

  const handleCheck = () => {
    if (!input.trim()) {
      setError("Please enter a sample number.");
      setResult(null);
      return;
    }
    setError(null);
    setLoading(true);
    // Simulate a brief async demo action.
    setTimeout(() => {
      setResult(DEMO);
      setLoading(false);
    }, 500);
  };

  return (
    <section className="glass-panel rise-in relative overflow-hidden rounded-3xl p-6 sm:p-9">
      <div
        className="bg-signal pointer-events-none absolute inset-x-0 top-0 h-px opacity-70"
        aria-hidden
      />
      <div className="flex items-center gap-3">
        <span className="bg-signal grid size-10 place-items-center rounded-2xl text-primary-foreground">
          <MapPin className="size-5" aria-hidden />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Demo feature
          </p>
          <h2 className="text-xl font-semibold text-foreground">Regional Data Demo</h2>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Enter a sample number and click the button to show a hardcoded demonstration with an
        OpenStreetMap view.
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Enter a number (e.g., +91 98765 43210)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="h-10 rounded-xl border-border bg-background/50 sm:flex-1"
        />
        <Button
          onClick={handleCheck}
          disabled={loading}
          className="bg-signal h-10 rounded-xl px-6 font-semibold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-70"
        >
          <Search className="size-4" aria-hidden />
          {loading ? "Checking…" : "Check Demo"}
        </Button>
      </div>

      {error && (
        <p className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-6 space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-background/40 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Country
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">{result.country}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/40 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Region
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">{result.region}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/40 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                City
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">{result.city}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/40 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Category
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">{result.category}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border">
            <div ref={mapRef} className="h-80 w-full" />
          </div>

          <p className="flex items-start gap-2 rounded-2xl border border-border bg-background/40 px-4 py-3 text-xs text-muted-foreground">
            <Info className="mt-px size-4 shrink-0 text-primary" aria-hidden />
            This is fictional demonstration data and is not connected to any real person or device.
          </p>
        </div>
      )}
    </section>
  );
}
