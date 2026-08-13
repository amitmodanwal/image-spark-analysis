import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

const STEPS = [
  "Reading images",
  "Detecting visual entities",
  "Comparing images",
  "Finding relationships",
  "Generating summary",
];

export function LoadingAnalysis() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 2600);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="glass-panel rise-in rounded-3xl p-6 sm:p-8">
      <h2 className="flex items-center gap-2.5 text-lg font-semibold text-foreground">
        <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
        Analyzing evidence
        <span className="text-muted-foreground">…</span>
      </h2>
      <ol className="mt-6 space-y-3">
        {STEPS.map((step, i) => {
          const done = i < active;
          const current = i === active;
          return (
            <li
              key={step}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-all duration-500 ${
                current
                  ? "glow-ring border-primary/40 bg-primary/10 text-foreground"
                  : done
                    ? "border-border bg-background/30 text-muted-foreground"
                    : "border-transparent text-muted-foreground/60"
              }`}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full border border-border bg-background/60">
                {done ? (
                  <Check className="size-3.5 text-success" aria-hidden />
                ) : current ? (
                  <Loader2 className="size-3.5 animate-spin text-primary" aria-hidden />
                ) : (
                  <span className="font-mono text-[10px] font-semibold">{i + 1}</span>
                )}
              </span>
              {step}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
