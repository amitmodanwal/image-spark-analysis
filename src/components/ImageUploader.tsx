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
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-card p-4 shadow-sm transition-all ${
        dragging ? "border-primary ring-2 ring-ring/40" : "border-border hover:shadow-md"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="grid size-6 place-items-center rounded-md bg-secondary text-xs font-bold text-secondary-foreground">
            {index + 1}
          </span>
          Image {index + 1}
        </span>
        {slot.status === "uploaded" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
            <CheckCircle2 className="size-3.5" aria-hidden /> Uploaded
          </span>
        )}
        {slot.status === "error" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
            <TriangleAlert className="size-3.5" aria-hidden /> Failed
          </span>
        )}
      </div>

      <div className="relative flex min-h-44 flex-1 items-center justify-center rounded-xl border border-dashed border-border bg-muted/40">
        {slot.previewUrl ? (
          <img
            src={slot.previewUrl}
            alt={`Evidence image ${index + 1} preview`}
            className="h-44 w-full rounded-xl object-cover"
          />
        ) : (
          <div className="px-4 py-8 text-center">
            <ImageIcon className="mx-auto size-7 text-muted-foreground" aria-hidden />
            <p className="mt-2 text-sm font-medium text-foreground">Drag &amp; drop an image</p>
            <p className="mt-1 text-xs text-muted-foreground">JPG, PNG or WEBP · max 10 MB</p>
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 grid place-items-center rounded-xl bg-card/75 backdrop-blur-sm">
            <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
          </div>
        )}
      </div>

      {busy && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all"
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
          className="flex-1"
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
