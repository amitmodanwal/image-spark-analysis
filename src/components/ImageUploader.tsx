import { useRef, useState } from "react";
import { CheckCircle2, CloudUpload, ImageIcon, Loader2, Trash2, TriangleAlert } from "lucide-react";
import type { ImageSlot } from "@/types/analysis";
import { Button } from "@/components/ui/button";

interface ImageUploaderProps {
  index: number;
  slot: ImageSlot;
  onSelect: (index: number, file: File) => void;
  onRemove: (index: number) => void;
  disabled?: boolean | undefined;
}

export function ImageUploader({ index, slot, onSelect, onRemove, disabled }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const busy = slot.status === "uploading" || slot.status === "validating";

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onSelect(index, file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!disabled) handleFiles(e.dataTransfer.files);
      }}
      className={`glass-panel group relative flex flex-col overflow-hidden rounded-3xl p-4 transition-all duration-500 ${
        dragging ? "glow-ring border-primary/60" : "hover:border-primary/25"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="grid size-6 place-items-center rounded-lg border border-border bg-background/50 font-mono text-[11px] font-bold text-primary">
            {index + 1}
          </span>
          Image {index + 1}
        </span>
        {slot.status === "uploaded" && (
          <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
            <CheckCircle2 className="size-3.5" aria-hidden /> Uploaded
          </span>
        )}
        {slot.status === "error" && (
          <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
            <TriangleAlert className="size-3.5" aria-hidden /> Failed
          </span>
        )}
      </div>

      <div className="relative flex min-h-44 flex-1 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-background/30">
        {slot.previewUrl ? (
          <img
            src={slot.previewUrl}
            alt={`Evidence image ${index + 1} preview`}
            className="h-44 w-full rounded-2xl object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="px-4 py-8 text-center">
            <span className="mx-auto grid size-11 place-items-center rounded-2xl border border-border bg-background/50 text-primary">
              <ImageIcon className="size-5" aria-hidden />
            </span>
            <p className="mt-3 text-sm font-medium text-foreground">Drag &amp; drop an image</p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              JPG · PNG · WEBP · max 10 MB
            </p>
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 grid place-items-center rounded-2xl bg-background/70 backdrop-blur-sm">
            <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
          </div>
        )}
      </div>

      {busy && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-background/60">
          <div
            className="bg-signal h-full rounded-full transition-all"
            style={{ width: `${slot.progress}%` }}
          />
        </div>
      )}

      {slot.error && (
        <p className="mt-3 flex items-start gap-1.5 text-xs text-destructive">
          <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
          {slot.error}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="flex-1 rounded-xl"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
        >
          <CloudUpload className="size-4" aria-hidden />
          {slot.previewUrl ? "Replace" : "Upload"}
        </Button>
        {slot.previewUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-xl"
            disabled={disabled || busy}
            onClick={() => onRemove(index)}
            aria-label={`Remove image ${index + 1}`}
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
