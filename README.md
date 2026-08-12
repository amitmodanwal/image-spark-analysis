# EvidenceLens AI

AI-powered image relationship analysis. Upload 2–3 images, and the app analyzes them together to
identify visual entities, possible relationships, important findings and an investigation-style
summary — with an interactive relationship graph.

> Decision-support tool only. It never confirms a person's identity and AI confidence is not proof.

## Stack

- Frontend: React + TypeScript + Vite + Tailwind CSS + Lucide icons + React Flow
- Image hosting: Cloudinary unsigned upload (browser → Cloudinary, no API secret in the client)
- Backend: TanStack Start server route (`POST /api/analyze`) running on the same dev server
- AI: OpenAI Responses API (vision model), called only from the server

The backend lives in `src/routes/api/analyze.ts` instead of a separate Express process, so one
command runs both frontend and backend.

## 1. Create a Cloudinary account

Go to https://cloudinary.com and sign up for the free tier.

## 2. Find your Cloud Name

Cloudinary Console → Dashboard → "Product Environment" panel → **Cloud name**.

## 3. Create an unsigned upload preset

Settings (gear icon) → **Upload** → **Upload presets** → **Add upload preset** →
set *Signing mode* to **Unsigned** → save → copy the preset name.

## 4. Create an OpenAI API key

https://platform.openai.com/api-keys → **Create new secret key** → copy it.
This key must only ever live on the server.

## 5. Environment variables

Copy `.env.example` to `.env` and fill it in:

```
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-unsigned-preset
OPENAI_API_KEY=sk-...
PORT=5000
```

Only `VITE_*` variables are readable by the browser. On Lovable, the AI call is authenticated by
the managed server-side key, so `OPENAI_API_KEY` is only needed when running the AI outside Lovable.
If Cloudinary variables are missing, uploads fall back to in-browser images so the app still runs.

## 6. Install dependencies

```bash
npm install
```

## 7. Start the app (frontend + backend)

```bash
npm run dev
```

Open http://localhost:8080

## 8. Backend

The API is served by the same dev server at `POST /api/analyze`:

```json
{ "images": ["https://res.cloudinary.com/.../1.jpg", "https://res.cloudinary.com/.../2.jpg"] }
```

Response:

```json
{ "success": true, "analysis": { "images": [], "relationships": [], "summary": "", "importantFindings": [], "confidence": 0 } }
```

## 9. How to test

1. Upload 2 images → the Analyze button enables.
2. Upload a 3rd image → still works (max 3).
3. Check each card shows upload progress and an "Uploaded" status with the Cloudinary URL stored.
4. Click **Analyze Relationships** → animated analysis steps appear.
5. Verify the summary, per-image entities, relationship cards with confidence bars, important
   findings and the relationship graph render.
6. Error cases: upload a >10 MB file or a GIF (validation error), remove an image and try to
   analyze with only 1 (button disabled), disconnect the network mid-analysis (friendly error).
