import { Gauge } from "lucide-react";

interface ConfidenceBarProps {
  value: number;
  label?: string;
}

export function ConfidenceBar({ value, label = "AI confidence" }: ConfidenceBarProps) {
  const pct = Math.round(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)) * 100);

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 uppercase tracking-[0.14em]">
          <Gauge className="size-3.5" aria-hidden />
          {label}
        </span>
        <span className="font-mono text-sm tabular-nums text-foreground">{pct}%</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full border border-border bg-background/60"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="bg-signal h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
