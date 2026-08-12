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
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
        <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
        Analyzing evidence...
      </h2>
      <ol className="mt-5 space-y-3">
        {STEPS.map((step, i) => {
          const done = i < active;
          const current = i === active;
          return (
            <li
              key={step}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all ${
                current
                  ? "border-primary/40 bg-primary/5 text-foreground"
                  : done
                    ? "border-transparent bg-muted/50 text-muted-foreground"
                    : "border-transparent text-muted-foreground/70"
              }`}
            >
              <span className="grid size-6 shrink-0 place-items-center rounded-full border border-border bg-card">
                {done ? (
                  <Check className="size-3.5 text-success" aria-hidden />
                ) : current ? (
                  <Loader2 className="size-3.5 animate-spin text-primary" aria-hidden />
                ) : (
                  <span className="text-[10px] font-semibold">{i + 1}</span>
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
