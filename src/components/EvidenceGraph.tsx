import { useEffect, useMemo, useState } from "react";
import { Background, Controls, ReactFlow, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Share2 } from "lucide-react";
import type { Analysis } from "@/types/analysis";

function humanize(type: string) {
  return type.replace(/[_-]+/g, " ");
}

const CATEGORY_KEYS = ["person", "vehicle", "location", "object"] as const;

function buildGraph(analysis: Analysis): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const imageLabels = analysis.images.map((img) => `Image ${img.imageNumber}`);
  imageLabels.forEach((label, i) => {
    nodes.push({
      id: label,
      position: { x: 60, y: 60 + i * 160 },
      data: { label },
      style: {
        borderRadius: 12,
        border: "1px solid var(--color-primary)",
        background: "var(--color-primary)",
        color: "var(--color-primary-foreground)",
        fontWeight: 600,
        padding: 10,
        width: 130,
      },
    });
  });

  const categories = new Set<string>();
  analysis.images.forEach((img) => {
    img.entities?.forEach((entity) => {
      const key = CATEGORY_KEYS.find((c) => entity.type?.toLowerCase().includes(c));
      if (!key) return;
      categories.add(key);
      edges.push({
        id: `e-${img.imageNumber}-${key}`,
        source: `Image ${img.imageNumber}`,
        target: key,
        label: key,
        animated: false,
        style: { stroke: "var(--color-border)" },
      });
    });
  });

  [...categories].forEach((key, i) => {
    nodes.push({
      id: key,
      position: { x: 420, y: 40 + i * 110 },
      data: { label: key.charAt(0).toUpperCase() + key.slice(1) },
      style: {
        borderRadius: 999,
        border: "1px solid var(--color-border)",
        background: "var(--color-card)",
        color: "var(--color-foreground)",
        padding: 10,
        width: 120,
        textAlign: "center" as const,
      },
    });
  });

  analysis.relationships?.forEach((rel, i) => {
    if (!imageLabels.includes(rel.from) || !imageLabels.includes(rel.to)) return;
    edges.push({
      id: `r-${i}`,
      source: rel.from,
      target: rel.to,
      label: `${humanize(rel.type)} (${Math.round((rel.confidence ?? 0) * 100)}%)`,
      animated: true,
      style: { stroke: "var(--color-accent)", strokeWidth: 2 },
      labelStyle: { fontSize: 11, fill: "var(--color-foreground)" },
    });
  });

  return { nodes, edges };
}

export function EvidenceGraph({ analysis }: { analysis: Analysis }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { nodes, edges } = useMemo(() => buildGraph(analysis), [analysis]);

  return (
    <section className="glass-panel rise-in rounded-3xl p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
        <Share2 className="size-5 text-primary" aria-hidden />
        Visual Relationship Graph
      </h2>
      <div className="mt-4 h-[420px] w-full overflow-hidden rounded-2xl border border-border bg-background/40">
        {mounted && (
          <ReactFlow nodes={nodes} edges={edges} fitView proOptions={{ hideAttribution: true }}>
            <Background />
            <Controls showInteractive={false} />
          </ReactFlow>
        )}
      </div>
    </section>
  );
}
