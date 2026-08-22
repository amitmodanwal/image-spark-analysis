import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const BodySchema = z.object({
  images: z
    .array(z.string().min(1))
    .min(2, "Please provide at least 2 images.")
    .max(3, "You can analyze a maximum of 3 images."),
});

const SYSTEM_INSTRUCTION = `You are an AI visual evidence analysis assistant.
Analyze multiple uploaded images together.
Your job is to identify observable visual entities and possible relationships between the images.
For each image identify: people, vehicles, objects, locations, visible text, distinctive visual features, relevant environmental details.
Then compare all images and identify: same or similar person, same or similar vehicle, same location, common object, matching visual characteristics, chronological or contextual clues if visible, other meaningful relationships.
Do not invent facts. Do not identify a real person's identity from appearance.
Clearly distinguish: 1. Directly observable evidence 2. Possible relationship 3. Uncertain inference.
Every relationship must include supporting evidence and a confidence score between 0 and 1.
Use cautious wording such as "possible", "visual similarity detected", "appears consistent with".
The final response must be valid JSON with this exact structure:
{
  "images": [{ "imageNumber": 1, "description": "...", "entities": [{ "type": "person|vehicle|object|location|text|feature|environment", "description": "..." }] }],
  "relationships": [{ "from": "Image 1", "to": "Image 2", "type": "...", "description": "...", "evidence": ["..."], "confidence": 0.0-1.0 }],
  "importantFindings": ["..."],
  "summary": "...",
  "confidence": 0.0-1.0
}`;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isValidImageRef(value: string) {
  return value.startsWith("https://") || value.startsWith("data:image/");
}

function toBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

async function toImageUrl(ref: string): Promise<string> {
  if (ref.startsWith("data:image/")) return ref;
  const res = await fetch(ref);
  if (!res.ok) throw new Error("image_fetch_failed");
  const mimeType = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  return `data:${mimeType};base64,${toBase64(await res.arrayBuffer())}`;
}

export const Route = createFileRoute("/api/analyze")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsedBody: unknown;
        try {
          parsedBody = await request.json();
        } catch {
          return json({ success: false, error: "Invalid request body." }, 400);
        }

        const parsed = BodySchema.safeParse(parsedBody);
        if (!parsed.success) {
          return json(
            { success: false, error: parsed.error.issues[0]?.message ?? "Invalid request." },
            400,
          );
        }
        const images = parsed.data.images;
        if (!images.every(isValidImageRef)) {
          return json({ success: false, error: "Images must be valid HTTPS image URLs." }, 400);
        }

        const apiKey = process.env["OPENAI_API_KEY"];
        if (!apiKey) {
          return json({ success: false, error: "AI service is not configured. Set OPENAI_API_KEY." }, 500);
        }

        let imageUrls: string[];
        try {
          imageUrls = await Promise.all(images.map(toImageUrl));
        } catch {
          return json({ success: false, error: "Could not read one of the uploaded images." }, 502);
        }

        const userContent: Array<Record<string, unknown>> = [
          {
            type: "text",
            text: `Analyze these ${images.length} images together and return the structured JSON analysis. Identify relationships, common evidence, differences and relevant connections between them. Reference images as "Image 1", "Image 2"${images.length === 3 ? ', "Image 3"' : ""}.`,
          },
          ...imageUrls.map((url) => ({ type: "image_url", image_url: { url } })),
        ];

        let res: Response;
        try {
          res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-4o",
              messages: [
                { role: "system", content: SYSTEM_INSTRUCTION },
                { role: "user", content: userContent },
              ],
              response_format: { type: "json_object" },
              max_tokens: 4096,
            }),
          });
        } catch {
          return json({ success: false, error: "Could not reach the AI service." }, 502);
        }

        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          console.error(`OpenAI request failed [${res.status}]: ${detail}`);
          const status = res.status === 429 ? 429 : res.status === 402 || res.status === 401 ? 402 : 502;
          const message =
            status === 429
              ? "Too many requests right now. Please retry in a moment."
              : status === 402
                ? "AI credits are exhausted or the API key is invalid. Please check your OpenAI API key."
                : "The AI service could not complete this analysis.";
          return json({ success: false, error: message }, status);
        }

        let payload: { choices?: Array<{ message?: { content?: string } }> };
        try {
          payload = await res.json();
        } catch {
          return json({ success: false, error: "The AI returned an unreadable analysis." }, 502);
        }

        const text = payload.choices?.[0]?.message?.content ?? "";

        if (!text.trim()) {
          return json({ success: false, error: "The AI returned an empty analysis." }, 502);
        }

        try {
          const analysis = JSON.parse(text);
          return json({ success: true, analysis });
        } catch {
          return json({ success: false, error: "The AI returned an unreadable analysis." }, 502);
        }
      },
    },
  },
});
