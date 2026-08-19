export type CaseStatus = "open" | "closed" | "archived";
export type EvidenceCategory =
  | "audio_recording"
  | "pdf"
  | "document"
  | "witness_statement"
  | "fir_report"
  | "call_record"
  | "image"
  | "other";
export type VerificationStatus = "pending" | "verified" | "rejected";
export type PersonType = "suspect" | "victim" | "witness";
export type AuditAction = "create" | "update" | "delete" | "view";

export interface CaseRecord {
  id: string;
  user_id: string;
  case_number: string;
  title: string;
  status: CaseStatus;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface EvidenceRecord {
  id: string;
  case_id: string;
  user_id: string;
  title: string;
  description: string;
  category: EvidenceCategory;
  source: string;
  evidence_date: string | null;
  location_id: string | null;
  related_person_type: PersonType | null;
  related_person_id: string | null;
  notes: string;
  verification_status: VerificationStatus;
  file_path: string | null;
  file_name: string;
  file_type: string;
  file_size_bytes: number;
  uploaded_by: string | null;
  created_at: string;
  location?: LocationRecord | null;
}

export interface SuspectRecord {
  id: string;
  case_id: string;
  name: string;
  contact: string;
  id_reference: string;
  notes: string;
  created_at: string;
}

export interface VictimRecord {
  id: string;
  case_id: string;
  name: string;
  contact: string;
  id_reference: string;
  notes: string;
  created_at: string;
}

export interface WitnessRecord {
  id: string;
  case_id: string;
  name: string;
  contact: string;
  statement: string;
  statement_date: string | null;
  notes: string;
  created_at: string;
}

export interface VehicleRecord {
  id: string;
  case_id: string;
  registration_number: string;
  vehicle_type: string;
  make_model: string;
  color: string;
  owner_reference: string;
  notes: string;
  created_at: string;
}

export interface LocationRecord {
  id: string;
  case_id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  date_time: string | null;
  notes: string;
  created_at: string;
}

export interface CaseEventRecord {
  id: string;
  case_id: string;
  title: string;
  description: string;
  event_date: string;
  location_id: string | null;
  event_type: string;
  created_at: string;
  location?: LocationRecord | null;
}

export interface AuditLogRecord {
  id: string;
  case_id: string;
  user_id: string;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface CaseWithCounts extends CaseRecord {
  evidence_count?: number;
  suspects_count?: number;
  victims_count?: number;
  witnesses_count?: number;
  vehicles_count?: number;
  locations_count?: number;
}

export const EVIDENCE_CATEGORY_LABELS: Record<EvidenceCategory, string> = {
  audio_recording: "Audio Recording",
  pdf: "PDF",
  document: "Document",
  witness_statement: "Witness Statement",
  fir_report: "FIR / Case Report",
  call_record: "Call Record",
  image: "Image",
  other: "Other",
};

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  pending: "Pending",
  verified: "Verified",
  rejected: "Rejected",
};

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  open: "Open",
  closed: "Closed",
  archived: "Archived",
};
