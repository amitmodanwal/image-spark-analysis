import type { AnalyzeResponse } from "@/types/analysis";

export async function analyzeImages(images: string[]): Promise<AnalyzeResponse> {
  if (images.length < 2) throw new Error("Please upload at least 2 images before analyzing.");
  if (images.length > 3) throw new Error("You can analyze a maximum of 3 images.");

  let res: Response;
  try {
    res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images }),
    });
  } catch {
    throw new Error("Analysis service is unavailable. Please try again in a moment.");
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new Error("The analysis service returned an unreadable response.");
  }

  const data = body as { success?: boolean; error?: string; analysis?: AnalyzeResponse["analysis"] };
  if (!res.ok || !data.success || !data.analysis) {
    throw new Error(data.error || "Analysis failed. Please try again.");
  }
  return { success: true, analysis: data.analysis };
}
