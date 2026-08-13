import { ArrowRight, Link2, ListChecks } from "lucide-react";
import type { Relationship } from "@/types/analysis";
import { ConfidenceBar } from "@/components/ConfidenceBar";

function humanize(type: string) {
  return type.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function RelationshipCard({ relationship }: { relationship: Relationship }) {
  return (
    <article className="glass-panel hover-lift rounded-3xl p-6">
      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
        <span className="rounded-xl border border-border bg-background/40 px-3 py-1.5 text-foreground">
          {relationship.from}
        </span>
        <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-primary">
          <Link2 className="size-3.5" aria-hidden />
          {humanize(relationship.type)}
        </span>
        <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
        <span className="rounded-xl border border-border bg-background/40 px-3 py-1.5 text-foreground">
          {relationship.to}
        </span>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {relationship.description}
      </p>

      {relationship.evidence?.length > 0 && (
        <div className="mt-5 rounded-2xl border border-border bg-background/35 p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-foreground">
            <ListChecks className="size-3.5 text-primary" aria-hidden />
            Supporting evidence
          </p>
          <ul className="mt-2.5 space-y-1.5">
            {relationship.evidence.map((item, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                <span className="text-primary">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5">
        <ConfidenceBar value={relationship.confidence} />
      </div>
    </article>
  );
}
