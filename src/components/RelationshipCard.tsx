import { ArrowRight, Link2, ListChecks } from "lucide-react";
import type { Relationship } from "@/types/analysis";
import { ConfidenceBar } from "@/components/ConfidenceBar";

function humanize(type: string) {
  return type.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function RelationshipCard({ relationship }: { relationship: Relationship }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
        <span className="rounded-lg bg-secondary px-2.5 py-1 text-secondary-foreground">
          {relationship.from}
        </span>
        <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-primary">
          <Link2 className="size-3.5" aria-hidden />
          {humanize(relationship.type)}
        </span>
        <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
        <span className="rounded-lg bg-secondary px-2.5 py-1 text-secondary-foreground">
          {relationship.to}
        </span>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">{relationship.description}</p>

      {relationship.evidence?.length > 0 && (
        <div className="mt-4 rounded-xl bg-muted/60 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <ListChecks className="size-3.5 text-primary" aria-hidden />
            Supporting observable evidence
          </p>
          <ul className="mt-2 space-y-1">
            {relationship.evidence.map((item, i) => (
              <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                <span className="text-primary">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4">
        <ConfidenceBar value={relationship.confidence} />
      </div>
    </article>
  );
}
