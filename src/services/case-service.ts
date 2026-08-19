import { supabase } from "@/lib/supabase";
import type {
  AuditAction,
  AuditLogRecord,
  CaseEventRecord,
  CaseRecord,
  CaseStatus,
  CaseWithCounts,
  EvidenceCategory,
  EvidenceRecord,
  LocationRecord,
  PersonType,
  SuspectRecord,
  VerificationStatus,
  VictimRecord,
  VehicleRecord,
  WitnessRecord,
} from "@/types/case";

const MAX_FILE_BYTES = 50 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg",
  "audio/webm", "audio/aac", "audio/m4a", "audio/x-m4a",
  "application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain", "text/csv",
  "image/jpeg", "image/jpg", "image/png", "image/webp",
];

export function validateEvidenceFile(file: File): string | null {
  if (file.size > MAX_FILE_BYTES) return "File is too large. Maximum size is 50 MB.";
  const type = file.type.toLowerCase();
  if (type && !ALLOWED_FILE_TYPES.includes(type)) {
    return "Unsupported file type. Allowed: audio (mp3, wav, ogg, m4a), PDF, documents, text, images.";
  }
  return null;
}

export function fileCategoryFromType(file: File): EvidenceCategory {
  const type = file.type.toLowerCase();
  if (type.startsWith("audio/")) return "audio_recording";
  if (type === "application/pdf") return "pdf";
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("text/")) return "document";
  if (type.includes("word") || type.includes("document")) return "document";
  return "other";
}

export async function logAudit(
  caseId: string,
  action: AuditAction,
  entityType: string,
  entityId: string | null,
  details: Record<string, unknown> = {},
): Promise<void> {
  await supabase.from("audit_logs").insert({
    case_id: caseId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
  });
}

export async function fetchCases(): Promise<CaseWithCounts[]> {
  const { data, error } = await supabase.from("cases").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  const cases = (data ?? []) as CaseRecord[];
  if (cases.length === 0) return [];

  const counts = await Promise.all(
    cases.map(async (c) => {
      const [ev, su, vi, wi, ve, lo] = await Promise.all([
        supabase.from("evidence").select("id", { count: "exact", head: true }).eq("case_id", c.id),
        supabase.from("suspects").select("id", { count: "exact", head: true }).eq("case_id", c.id),
        supabase.from("victims").select("id", { count: "exact", head: true }).eq("case_id", c.id),
        supabase.from("witnesses").select("id", { count: "exact", head: true }).eq("case_id", c.id),
        supabase.from("vehicles").select("id", { count: "exact", head: true }).eq("case_id", c.id),
        supabase.from("locations").select("id", { count: "exact", head: true }).eq("case_id", c.id),
      ]);
      return {
        ...c,
        evidence_count: ev.count ?? 0,
        suspects_count: su.count ?? 0,
        victims_count: vi.count ?? 0,
        witnesses_count: wi.count ?? 0,
        vehicles_count: ve.count ?? 0,
        locations_count: lo.count ?? 0,
      };
    }),
  );
  return counts;
}

export async function fetchCase(caseId: string): Promise<CaseRecord | null> {
  const { data, error } = await supabase.from("cases").select("*").eq("id", caseId).maybeSingle();
  if (error) throw error;
  return data as CaseRecord | null;
}

export async function createCase(input: {
  title: string; case_number?: string; status?: CaseStatus; description?: string;
}): Promise<CaseRecord> {
  const { data, error } = await supabase
    .from("cases")
    .insert({ title: input.title, case_number: input.case_number ?? "", status: input.status ?? "open", description: input.description ?? "" })
    .select().single();
  if (error) throw error;
  const created = data as CaseRecord;
  await logAudit(created.id, "create", "case", created.id, { title: created.title });
  return created;
}

export async function updateCase(
  caseId: string,
  patch: Partial<Pick<CaseRecord, "title" | "case_number" | "status" | "description">>,
): Promise<void> {
  const { error } = await supabase.from("cases").update(patch).eq("id", caseId);
  if (error) throw error;
  await logAudit(caseId, "update", "case", caseId, patch as Record<string, unknown>);
}

export async function deleteCase(caseId: string): Promise<void> {
  await logAudit(caseId, "delete", "case", caseId, {});
  const { error } = await supabase.from("cases").delete().eq("id", caseId);
  if (error) throw error;
}

export async function fetchEvidence(caseId: string): Promise<EvidenceRecord[]> {
  const { data, error } = await supabase
    .from("evidence").select("*, location:locations(*)").eq("case_id", caseId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as EvidenceRecord[];
}

export interface EvidenceUploadInput {
  case_id: string; title: string; description?: string; category: EvidenceCategory;
  source?: string; evidence_date?: string | null; location_id?: string | null;
  related_person_type?: PersonType | null; related_person_id?: string | null;
  notes?: string; file?: File | null;
}

export async function uploadEvidenceItem(input: EvidenceUploadInput): Promise<EvidenceRecord> {
  let filePath: string | null = null;
  let fileName = ""; let fileType = ""; let fileSize = 0;

  if (input.file) {
    const validationError = validateEvidenceFile(input.file);
    if (validationError) throw new Error(validationError);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("You must be signed in to upload evidence.");
    const ext = input.file.name.split(".").pop() ?? "file";
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    const { error: upErr } = await supabase.storage.from("case-evidence").upload(path, input.file, { contentType: input.file.type || undefined });
    if (upErr) throw new Error(`File upload failed: ${upErr.message}`);
    filePath = path; fileName = input.file.name; fileType = input.file.type; fileSize = input.file.size;
  }

  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("evidence")
    .insert({
      case_id: input.case_id, title: input.title, description: input.description ?? "",
      category: input.category, source: input.source ?? "", evidence_date: input.evidence_date ?? null,
      location_id: input.location_id ?? null, related_person_type: input.related_person_type ?? null,
      related_person_id: input.related_person_id ?? null, notes: input.notes ?? "",
      file_path: filePath, file_name: fileName, file_type: fileType, file_size_bytes: fileSize,
      uploaded_by: user?.id ?? null,
    })
    .select("*, location:locations(*)").single();
  if (error) throw error;
  const created = data as EvidenceRecord;
  await logAudit(input.case_id, "create", "evidence", created.id, { title: created.title });
  return created;
}

export async function updateEvidenceVerification(caseId: string, evidenceId: string, status: VerificationStatus): Promise<void> {
  const { error } = await supabase.from("evidence").update({ verification_status: status }).eq("id", evidenceId);
  if (error) throw error;
  await logAudit(caseId, "update", "evidence", evidenceId, { verification_status: status });
}

export async function deleteEvidence(caseId: string, evidenceId: string, filePath: string | null): Promise<void> {
  await logAudit(caseId, "delete", "evidence", evidenceId, {});
  if (filePath) await supabase.storage.from("case-evidence").remove([filePath]);
  const { error } = await supabase.from("evidence").delete().eq("id", evidenceId);
  if (error) throw error;
}

export async function getEvidenceSignedUrl(filePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from("case-evidence").createSignedUrl(filePath, 300);
  if (error) return null;
  return data.signedUrl;
}

export async function fetchLocations(caseId: string): Promise<LocationRecord[]> {
  const { data, error } = await supabase.from("locations").select("*").eq("case_id", caseId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as LocationRecord[];
}

export async function createLocation(input: { case_id: string; name: string; address: string; latitude?: number | null; longitude?: number | null; date_time?: string | null; notes?: string }): Promise<LocationRecord> {
  const { data, error } = await supabase.from("locations").insert({
    case_id: input.case_id, name: input.name, address: input.address,
    latitude: input.latitude ?? null, longitude: input.longitude ?? null,
    date_time: input.date_time ?? null, notes: input.notes ?? "",
  }).select().single();
  if (error) throw error;
  const created = data as LocationRecord;
  await logAudit(input.case_id, "create", "location", created.id, { name: created.name });
  return created;
}

export async function deleteLocation(caseId: string, id: string): Promise<void> {
  await logAudit(caseId, "delete", "location", id, {});
  const { error } = await supabase.from("locations").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchSuspects(caseId: string): Promise<SuspectRecord[]> {
  const { data, error } = await supabase.from("suspects").select("*").eq("case_id", caseId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SuspectRecord[];
}

export async function createSuspect(input: { case_id: string; name: string; contact?: string; id_reference?: string; notes?: string }): Promise<SuspectRecord> {
  const { data, error } = await supabase.from("suspects").insert({
    case_id: input.case_id, name: input.name, contact: input.contact ?? "",
    id_reference: input.id_reference ?? "", notes: input.notes ?? "",
  }).select().single();
  if (error) throw error;
  const created = data as SuspectRecord;
  await logAudit(input.case_id, "create", "suspect", created.id, { name: created.name });
  return created;
}

export async function deleteSuspect(caseId: string, id: string): Promise<void> {
  await logAudit(caseId, "delete", "suspect", id, {});
  const { error } = await supabase.from("suspects").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchVictims(caseId: string): Promise<VictimRecord[]> {
  const { data, error } = await supabase.from("victims").select("*").eq("case_id", caseId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as VictimRecord[];
}

export async function createVictim(input: { case_id: string; name: string; contact?: string; id_reference?: string; notes?: string }): Promise<VictimRecord> {
  const { data, error } = await supabase.from("victims").insert({
    case_id: input.case_id, name: input.name, contact: input.contact ?? "",
    id_reference: input.id_reference ?? "", notes: input.notes ?? "",
  }).select().single();
  if (error) throw error;
  const created = data as VictimRecord;
  await logAudit(input.case_id, "create", "victim", created.id, { name: created.name });
  return created;
}

export async function deleteVictim(caseId: string, id: string): Promise<void> {
  await logAudit(caseId, "delete", "victim", id, {});
  const { error } = await supabase.from("victims").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchWitnesses(caseId: string): Promise<WitnessRecord[]> {
  const { data, error } = await supabase.from("witnesses").select("*").eq("case_id", caseId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as WitnessRecord[];
}

export async function createWitness(input: { case_id: string; name: string; contact?: string; statement?: string; statement_date?: string | null; notes?: string }): Promise<WitnessRecord> {
  const { data, error } = await supabase.from("witnesses").insert({
    case_id: input.case_id, name: input.name, contact: input.contact ?? "",
    statement: input.statement ?? "", statement_date: input.statement_date ?? null, notes: input.notes ?? "",
  }).select().single();
  if (error) throw error;
  const created = data as WitnessRecord;
  await logAudit(input.case_id, "create", "witness", created.id, { name: created.name });
  return created;
}

export async function deleteWitness(caseId: string, id: string): Promise<void> {
  await logAudit(caseId, "delete", "witness", id, {});
  const { error } = await supabase.from("witnesses").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchVehicles(caseId: string): Promise<VehicleRecord[]> {
  const { data, error } = await supabase.from("vehicles").select("*").eq("case_id", caseId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as VehicleRecord[];
}

export async function createVehicle(input: { case_id: string; registration_number?: string; vehicle_type?: string; make_model?: string; color?: string; owner_reference?: string; notes?: string }): Promise<VehicleRecord> {
  const { data, error } = await supabase.from("vehicles").insert({
    case_id: input.case_id, registration_number: input.registration_number ?? "",
    vehicle_type: input.vehicle_type ?? "", make_model: input.make_model ?? "",
    color: input.color ?? "", owner_reference: input.owner_reference ?? "", notes: input.notes ?? "",
  }).select().single();
  if (error) throw error;
  const created = data as VehicleRecord;
  await logAudit(input.case_id, "create", "vehicle", created.id, { registration_number: created.registration_number });
  return created;
}

export async function deleteVehicle(caseId: string, id: string): Promise<void> {
  await logAudit(caseId, "delete", "vehicle", id, {});
  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchCaseEvents(caseId: string): Promise<CaseEventRecord[]> {
  const { data, error } = await supabase.from("case_events").select("*, location:locations(*)").eq("case_id", caseId).order("event_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CaseEventRecord[];
}

export async function createCaseEvent(input: { case_id: string; title: string; description?: string; event_date: string; location_id?: string | null; event_type?: string }): Promise<CaseEventRecord> {
  const { data, error } = await supabase.from("case_events").insert({
    case_id: input.case_id, title: input.title, description: input.description ?? "",
    event_date: input.event_date, location_id: input.location_id ?? null, event_type: input.event_type ?? "general",
  }).select("*, location:locations(*)").single();
  if (error) throw error;
  const created = data as CaseEventRecord;
  await logAudit(input.case_id, "create", "case_event", created.id, { title: created.title });
  return created;
}

export async function deleteCaseEvent(caseId: string, id: string): Promise<void> {
  await logAudit(caseId, "delete", "case_event", id, {});
  const { error } = await supabase.from("case_events").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchAuditLogs(caseId: string): Promise<AuditLogRecord[]> {
  const { data, error } = await supabase.from("audit_logs").select("*").eq("case_id", caseId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AuditLogRecord[];
}
