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
The final response must be valid JSON.`;

const JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["images", "relationships", "importantFindings", "summary", "confidence"],
  properties: {
    images: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["imageNumber", "description", "entities"],
        properties: {
          imageNumber: { type: "integer" },
          description: { type: "string" },
          entities: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["type", "description"],
              properties: {
                type: {
                  type: "string",
                  enum: ["person", "vehicle", "object", "location", "text", "feature", "environment"],
                },
                description: { type: "string" },
              },
            },
          },
        },
      },
    },
    relationships: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["from", "to", "type", "description", "evidence", "confidence"],
        properties: {
          from: { type: "string" },
          to: { type: "string" },
          type: { type: "string" },
          description: { type: "string" },
          evidence: { type: "array", items: { type: "string" } },
          confidence: { type: "number" },
        },
      },
    },
    importantFindings: { type: "array", items: { type: "string" } },
    summary: { type: "string" },
    confidence: { type: "number" },
  },
} as const;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isValidImageRef(value: string) {
  return value.startsWith("https://") || value.startsWith("data:image/");
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

        // Server-only secret. Never referenced in client code or .env files.
        const apiKey = process.env["OPENAI_API_KEY"];
        if (!apiKey) {
          return json({ success: false, error: "AI service is not configured." }, 500);
        }

        const content: Array<Record<string, unknown>> = [
          {
            type: "input_text",
            text: `Analyze these ${images.length} images together and return the structured JSON analysis. Identify relationships, common evidence, differences and relevant connections between them. Reference images as "Image 1", "Image 2"${images.length === 3 ? ', "Image 3"' : ""}.`,
          },
          ...images.map((url) => ({ type: "input_image", image_url: url })),
        ];

        let res: Response;
        try {
          res = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-4o",
              stream: true,
              instructions: SYSTEM_INSTRUCTION,
              input: [{ role: "user", content }],
              text: {
                format: {
                  type: "json_schema",
                  name: "evidence_analysis",
                  strict: true,
                  schema: JSON_SCHEMA,
                },
              },
            }),
          });
        } catch {
          return json({ success: false, error: "Could not reach the AI service." }, 502);
        }


        if (!res.ok || !res.body) {
          const status = res.status === 429 ? 429 : res.status === 402 ? 402 : 502;
          const message =
            status === 429
              ? "Too many requests right now. Please retry in a moment."
              : status === 402
                ? "AI credits are exhausted. Please add credits to continue."
                : "The AI service could not complete this analysis.";
          return json({ success: false, error: message }, status);
        }

        let text = "";
        let streamError: { code?: string; message?: string } | null = null;
        try {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.startsWith("data:")) continue;
              const payload = line.slice(5).trim();
              if (!payload || payload === "[DONE]") continue;
              try {
                const event = JSON.parse(payload);
                if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
                  text += event.delta;
                } else if (event.type === "error") {
                  streamError = event.error ?? null;
                } else if (event.type === "response.failed") {
                  streamError = event.response?.error ?? streamError;
                } else if (event.type === "response.completed" && !text) {
                  const out = event.response?.output ?? [];
                  text =
                    event.response?.output_text ??
                    out
                      .flatMap((item: { content?: Array<{ text?: string }> }) => item.content ?? [])
                      .map((c: { text?: string }) => c.text ?? "")
                      .join("");
                }
              } catch {
                /* ignore malformed chunk */
              }
            }
          }
        } catch {
          return json({ success: false, error: "The analysis stream was interrupted." }, 502);
        }

        if (streamError) {
          const quota =
            streamError.code === "credit_balance_exhausted" ||
            streamError.code === "insufficient_quota";
          return json(
            {
              success: false,
              error: quota
                ? "OpenAI credits are exhausted. Add credits to your OpenAI account to continue."
                : (streamError.message ?? "The AI service could not complete this analysis."),
            },
            quota ? 402 : 502,
          );
        }

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
