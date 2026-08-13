import { Car, MapPin, Package, ScanText, Sparkles, Trees, User } from "lucide-react";
import type { ImageAnalysis } from "@/types/analysis";

const ICONS: Record<string, typeof User> = {
  person: User,
  vehicle: Car,
  object: Package,
  location: MapPin,
  text: ScanText,
  environment: Trees,
  feature: Sparkles,
};

interface ImageCardProps {
  analysis: ImageAnalysis;
  src?: string | undefined;
}

export function ImageCard({ analysis, src }: ImageCardProps) {
  return (
    <article className="glass-panel hover-lift group overflow-hidden rounded-3xl">
      <div className="relative">
        {src ? (
          <img
            src={src}
            alt={`Analyzed evidence image ${analysis.imageNumber}`}
            className="h-48 w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-48 w-full bg-muted" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-card/25 to-transparent" />
        <span className="absolute left-4 top-4 inline-flex items-center rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-semibold tracking-wide text-foreground backdrop-blur">
          Image {analysis.imageNumber}
        </span>
      </div>

      <div className="p-5">
        <p className="text-sm leading-relaxed text-muted-foreground">{analysis.description}</p>
        <ul className="mt-4 space-y-2.5">
          {analysis.entities?.map((entity, i) => {
            const Icon = ICONS[entity.type] ?? Sparkles;
            return (
              <li
                key={i}
                className="flex items-start gap-2.5 rounded-xl border border-border/70 bg-background/30 px-3 py-2 text-sm"
              >
                <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span>
                  <span className="font-medium capitalize text-foreground">{entity.type}: </span>
                  <span className="text-muted-foreground">{entity.description}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </article>
  );
}
