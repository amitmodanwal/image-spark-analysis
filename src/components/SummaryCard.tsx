import { FileText, ShieldAlert } from "lucide-react";
import { ConfidenceBar } from "@/components/ConfidenceBar";

interface SummaryCardProps {
  summary: string;
  confidence: number;
}

export function SummaryCard({ summary, confidence }: SummaryCardProps) {
  return (
    <section className="glass-panel rise-in relative overflow-hidden rounded-3xl p-6 sm:p-9">
      <div
        className="bg-signal pointer-events-none absolute inset-x-0 top-0 h-px opacity-70"
        aria-hidden
      />
      <div className="flex items-center gap-3">
        <span className="bg-signal grid size-10 place-items-center rounded-2xl text-primary-foreground">
          <FileText className="size-5" aria-hidden />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Investigation report
          </p>
          <h2 className="text-xl font-semibold text-foreground">Overall Summary</h2>
        </div>
      </div>

      <p className="mt-5 text-base leading-relaxed text-foreground/90">{summary}</p>

      <div className="mt-6 max-w-sm">
        <ConfidenceBar value={confidence} label="Overall AI confidence" />
      </div>

      <p className="mt-6 flex items-start gap-2 rounded-2xl border border-border bg-background/40 px-4 py-3 text-xs text-muted-foreground">
        <ShieldAlert className="mt-px size-4 shrink-0 text-warning" aria-hidden />
        Decision-support output only. AI confidence is not statistical proof and does not establish
        identity; verify every finding independently.
      </p>
    </section>
  );
}
