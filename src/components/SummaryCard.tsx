import { FileText, ShieldAlert } from "lucide-react";
import { ConfidenceBar } from "@/components/ConfidenceBar";

interface SummaryCardProps {
  summary: string;
  confidence: number;
}

export function SummaryCard({ summary, confidence }: SummaryCardProps) {
  return (
    <section className="rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/40 p-6 shadow-sm sm:p-8">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
        <FileText className="size-5 text-primary" aria-hidden />
        Overall Summary
      </h2>
      <p className="mt-3 text-base leading-relaxed text-foreground/90">{summary}</p>
      <div className="mt-5 max-w-sm">
        <ConfidenceBar value={confidence} label="Overall AI confidence" />
      </div>
      <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldAlert className="mt-px size-4 shrink-0 text-warning" aria-hidden />
        Decision-support output only. AI confidence is not statistical proof and does not establish
        identity; verify every finding independently.
      </p>
    </section>
  );
}
