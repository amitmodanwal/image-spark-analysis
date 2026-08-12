import { useState } from "react";
import { AlertTriangle, Images, Scan, Sparkles, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/ImageUploader";
import { ImageCard } from "@/components/ImageCard";
import { RelationshipCard } from "@/components/RelationshipCard";
import { SummaryCard } from "@/components/SummaryCard";
import { EvidenceGraph } from "@/components/EvidenceGraph";
import { LoadingAnalysis } from "@/components/LoadingAnalysis";
import { cloudinaryConfigured, uploadImage, validateImage } from "@/services/cloudinary";
import { analyzeImages } from "@/services/api";
import type { Analysis, ImageSlot } from "@/types/analysis";

const EMPTY_SLOT: ImageSlot = { status: "empty", progress: 0 };

export function Dashboard() {
  const [slots, setSlots] = useState<ImageSlot[]>([EMPTY_SLOT, EMPTY_SLOT, EMPTY_SLOT]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (index: number, patch: Partial<ImageSlot>) =>
    setSlots((prev) => prev.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)));

  const uploadedUrls = slots
    .filter((s) => s.status === "uploaded" && s.uploaded)
    .map((s) => s.uploaded!.secure_url);
  const canAnalyze = uploadedUrls.length >= 2 && uploadedUrls.length <= 3 && !loading;

  const handleSelect = async (index: number, file: File) => {
    setError(null);
    const validationError = validateImage(file);
    if (validationError) {
      update(index, { status: "error", error: validationError, progress: 0, previewUrl: undefined });
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    update(index, {
      status: "uploading",
      progress: 0,
      error: undefined,
      previewUrl,
      fileName: file.name,
    });
    try {
      const uploaded = await uploadImage(file, (progress) => update(index, { progress }));
      update(index, { status: "uploaded", progress: 100, uploaded });
    } catch (err) {
      update(index, {
        status: "error",
        progress: 0,
        error: err instanceof Error ? err.message : "Upload failed. Please try again.",
      });
    }
  };

  const handleRemove = (index: number) => {
    setSlots((prev) => prev.map((slot, i) => (i === index ? EMPTY_SLOT : slot)));
  };

  const handleAnalyze = async () => {
    if (uploadedUrls.length < 2) {
      setError("Please upload at least 2 images before analyzing.");
      return;
    }
    setError(null);
    setAnalysis(null);
    setLoading(true);
    try {
      const result = await analyzeImages(uploadedUrls);
      setAnalysis(result.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const previewFor = (imageNumber: number) => {
    const uploadedSlots = slots.filter((s) => s.status === "uploaded");
    return uploadedSlots[imageNumber - 1]?.previewUrl;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-5 sm:px-6">
          <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Scan className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-lg font-bold tracking-tight text-foreground">EvidenceLens AI</p>
            <p className="text-xs text-muted-foreground">AI-powered image relationship analysis</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
        <section>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            <Images className="size-6 text-primary" aria-hidden />
            Upload Evidence Images
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Upload 2–3 images and let AI identify visual relationships, common entities and possible
            connections.
          </p>

          {!cloudinaryConfigured && (
            <p className="mt-4 flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-xs text-foreground">
              <AlertTriangle className="mt-px size-4 shrink-0 text-warning" aria-hidden />
              Cloudinary is not configured. Images stay in your browser and are sent directly to the
              analysis service. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to
              enable Cloudinary hosting.
            </p>
          )}

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {slots.map((slot, i) => (
              <ImageUploader
                key={i}
                index={i}
                slot={slot}
                onSelect={handleSelect}
                onRemove={handleRemove}
                disabled={loading}
              />
            ))}
          </div>

          {error && (
            <p className="mt-5 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden />
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-col items-start gap-2">
            <Button size="lg" className="w-full sm:w-auto" disabled={!canAnalyze} onClick={handleAnalyze}>
              <Sparkles className="size-5" aria-hidden />
              Analyze Relationships
            </Button>
            <p className="text-xs text-muted-foreground">
              {uploadedUrls.length} of 3 images uploaded · minimum 2 required
            </p>
          </div>
        </section>

        {loading && <LoadingAnalysis />}

        {analysis && !loading && (
          <div className="space-y-10">
            <SummaryCard summary={analysis.summary} confidence={analysis.confidence} />

            <section>
              <h2 className="text-lg font-semibold text-foreground">Image Analysis</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {analysis.images?.map((image) => (
                  <ImageCard
                    key={image.imageNumber}
                    analysis={image}
                    src={previewFor(image.imageNumber)}
                  />
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground">Relationships Found</h2>
              {analysis.relationships?.length ? (
                <div className="mt-4 grid gap-5 lg:grid-cols-2">
                  {analysis.relationships.map((relationship, i) => (
                    <RelationshipCard key={i} relationship={relationship} />
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  No visual relationships were observed between these images.
                </p>
              )}
            </section>

            {analysis.importantFindings?.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-foreground">Important Findings</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {analysis.importantFindings.map((finding, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
                    >
                      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-warning/15 text-warning">
                        <AlertTriangle className="size-4" aria-hidden />
                      </span>
                      <p className="text-sm text-foreground">{finding}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <EvidenceGraph analysis={analysis} />
          </div>
        )}
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        EvidenceLens AI is a decision-support tool. It never confirms identity and may be wrong.
      </footer>
    </div>
  );
}
