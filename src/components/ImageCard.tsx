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
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {src ? (
        <img
          src={src}
          alt={`Analyzed evidence image ${analysis.imageNumber}`}
          className="h-44 w-full object-cover"
        />
      ) : (
        <div className="h-44 w-full bg-muted" />
      )}
      <div className="p-4">
        <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
          Image {analysis.imageNumber}
        </span>
        <p className="mt-2 text-sm text-muted-foreground">{analysis.description}</p>
        <ul className="mt-3 space-y-2">
          {analysis.entities?.map((entity, i) => {
            const Icon = ICONS[entity.type] ?? Sparkles;
            return (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span>
                  <span className="font-medium capitalize">{entity.type}: </span>
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
