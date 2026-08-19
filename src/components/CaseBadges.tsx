import type { CaseStatus, EvidenceCategory, VerificationStatus } from "@/types/case";
import { CASE_STATUS_LABELS, EVIDENCE_CATEGORY_LABELS, VERIFICATION_LABELS } from "@/types/case";

const STATUS_STYLES: Record<CaseStatus, string> = {
  open: "border-success/30 bg-success/10 text-success",
  closed: "border-border bg-muted text-muted-foreground",
  archived: "border-warning/30 bg-warning/10 text-warning",
};

const VERIFICATION_STYLES: Record<VerificationStatus, string> = {
  pending: "border-warning/30 bg-warning/10 text-warning",
  verified: "border-success/30 bg-success/10 text-success",
  rejected: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {CASE_STATUS_LABELS[status]}
    </span>
  );
}

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${VERIFICATION_STYLES[status]}`}>
      {VERIFICATION_LABELS[status]}
    </span>
  );
}

export function CategoryBadge({ category }: { category: EvidenceCategory }) {
  return (
    <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
      {EVIDENCE_CATEGORY_LABELS[category]}
    </span>
  );
}
