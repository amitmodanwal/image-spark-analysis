import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/pages/Dashboard";
import { AuthGate } from "@/components/AuthGate";

const title = "EvidenceLens AI — Image Relationship Analysis";
const description =
  "Upload 2–3 images and let AI detect visual entities, possible relationships and generate an investigation-style summary.";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AuthGate>
      <Dashboard />
    </AuthGate>
  ),
});

