import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  History,
  Images,
  LogIn,
  LogOut,
  Scan,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/ImageUploader";
import { ImageCard } from "@/components/ImageCard";
import { RelationshipCard } from "@/components/RelationshipCard";
import { SummaryCard } from "@/components/SummaryCard";
import { EvidenceGraph } from "@/components/EvidenceGraph";
import { LoadingAnalysis } from "@/components/LoadingAnalysis";
import { cloudinaryConfigured, uploadImage, validateImage } from "@/services/cloudinary";
import { analyzeImages } from "@/services/api";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Analysis, ImageSlot } from "@/types/analysis";


const EMPTY_SLOT: ImageSlot = { status: "empty", progress: 0 };

function SectionHeading({
  eyebrow,
  title,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  icon: typeof Images;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border bg-card/60 text-primary">
        <Icon className="size-5" aria-hidden />
      </span>
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          {eyebrow}
        </p>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [slots, setSlots] = useState<ImageSlot[]>([EMPTY_SLOT, EMPTY_SLOT, EMPTY_SLOT]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);


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
    setSaveState("idle");
    setLoading(true);
    try {
      const result = await analyzeImages(uploadedUrls);
      setAnalysis(result.analysis);
      if (supabaseConfigured && user) {
        const { error: saveError } = await supabase.from("analyses").insert({
          user_id: user.id,
          title: `${uploadedUrls.length}-image analysis`,
          image_urls: uploadedUrls,
          analysis: result.analysis,
          confidence: result.analysis.confidence ?? null,
        });
        setSaveError(saveError?.message ?? null);
        setSaveState(saveError ? "error" : "saved");
      }
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
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="bg-signal grid size-10 place-items-center rounded-2xl text-primary-foreground shadow-sm">
              <Scan className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-base font-bold tracking-tight text-foreground">EvidenceLens AI</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Visual intelligence suite
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground lg:inline-flex">
              <ShieldCheck className="size-3.5 text-success" aria-hidden />
              Decision-support mode
            </span>
            {user && (
              <Button asChild variant="outline" size="sm" className="rounded-xl">
                <Link to="/history">
                  <History className="size-4" aria-hidden />
                  <span className="hidden sm:inline">History</span>
                </Link>
              </Button>
            )}
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl"
                onClick={() => void signOut()}
              >
                <LogOut className="size-4" aria-hidden />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            ) : (
              <Button asChild size="sm" className="bg-signal rounded-xl text-primary-foreground">
                <Link to="/auth">
                  <LogIn className="size-4" aria-hidden />
                  Sign in
                </Link>
              </Button>
            )}
          </div>

        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-14 px-4 py-12 sm:px-6">
        {/* Hero */}
        <section className="rise-in relative overflow-hidden rounded-[2rem] border border-border p-8 sm:p-12">
          <div className="bg-signal pointer-events-none absolute inset-0 opacity-[0.08]" aria-hidden />
          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
              <Zap className="size-3.5 text-gold" aria-hidden />
              Multi-image AI correlation
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              See the <span className="text-gradient">connections</span> between your evidence.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Upload 2–3 images and let vision AI surface shared entities, plausible relationships
              and a structured investigation-style summary — complete with an interactive
              relationship graph.
            </p>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              <span>Entity detection</span>
              <span className="text-primary">/</span>
              <span>Cross-image linking</span>
              <span className="text-primary">/</span>
              <span>Confidence scoring</span>
            </div>
          </div>
        </section>

        <section>
          <SectionHeading eyebrow="Step 01" title="Upload evidence images" icon={Images} />

          {!cloudinaryConfigured && (
            <p className="mt-5 flex items-start gap-2 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-xs text-foreground">
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
            <p className="mt-5 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden />
              {error}
            </p>
          )}

          <div className="glass-panel mt-8 flex flex-col items-start gap-4 rounded-3xl p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Ready when you are</p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {uploadedUrls.length} of 3 uploaded · minimum 2 required
              </p>
            </div>
            <Button
              size="lg"
              className="bg-signal w-full rounded-xl font-semibold text-primary-foreground transition-transform hover:scale-[1.02] sm:w-auto"
              disabled={!canAnalyze}
              onClick={handleAnalyze}
            >
              <Sparkles className="size-5" aria-hidden />
              Analyze relationships
            </Button>
          </div>
        </section>

        {loading && <LoadingAnalysis />}

        {analysis && !loading && (
          <div className="space-y-14">
            <div>
              <SummaryCard summary={analysis.summary} confidence={analysis.confidence} />
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {saveState === "saved"
                  ? "Saved to your history"
                  : saveState === "error"
                    ? "Could not save to history"
                    : user
                      ? "Saving…"
                      : "Sign in to save this analysis"}
              </p>
            </div>


            <section>
              <SectionHeading eyebrow="Step 02" title="Image analysis" icon={Scan} />
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
              <SectionHeading eyebrow="Step 03" title="Relationships found" icon={Sparkles} />
              {analysis.relationships?.length ? (
                <div className="mt-6 grid gap-5 lg:grid-cols-2">
                  {analysis.relationships.map((relationship, i) => (
                    <RelationshipCard key={i} relationship={relationship} />
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  No visual relationships were observed between these images.
                </p>
              )}
            </section>

            {analysis.importantFindings?.length > 0 && (
              <section>
                <SectionHeading eyebrow="Step 04" title="Important findings" icon={AlertTriangle} />
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {analysis.importantFindings.map((finding, i) => (
                    <div
                      key={i}
                      className="glass-panel hover-lift flex items-start gap-3 rounded-2xl p-4"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-xl border border-warning/30 bg-warning/15 text-warning">
                        <AlertTriangle className="size-4" aria-hidden />
                      </span>
                      <p className="text-sm leading-relaxed text-foreground">{finding}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <EvidenceGraph analysis={analysis} />
          </div>
        )}
      </main>

      <footer className="border-t border-border py-8 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          EvidenceLens AI · decision-support only
        </p>
        <p className="mx-auto mt-2 max-w-md px-4 text-xs text-muted-foreground/80">
          It never confirms identity and may be wrong. Always verify findings independently.
        </p>
      </footer>
    </div>
  );
}
