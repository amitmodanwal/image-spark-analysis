/*
# Create case management tables

1. New Tables
- `cases` — top-level case records owned by a user
- `locations` — geographic locations tied to a case
- `evidence` — evidence items tied to a case, optionally linked to a location
- `suspects` — suspect records tied to a case
- `victims` — victim records tied to a case
- `witnesses` — witness records tied to a case
- `vehicles` — vehicle records tied to a case
- `case_events` — timeline events tied to a case, optionally linked to a location
- `audit_logs` — audit trail entries for actions on a case

2. Security
- RLS enabled on every table.
- Owner-scoped policies: authenticated users can only access rows on cases they own.
- Child tables (evidence, locations, suspects, victims, witnesses, vehicles, case_events, audit_logs)
  are scoped through the parent cases table via EXISTS subquery on case ownership.
- user_id columns default to auth.uid() so client inserts that omit user_id succeed.

3. Storage
- Creates a public-readable storage bucket "case-evidence" for evidence file uploads.
*/

-- ── cases ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  case_number text NOT NULL DEFAULT '',
  title text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','archived')),
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_cases" ON public.cases;
CREATE POLICY "select_own_cases" ON public.cases FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_cases" ON public.cases;
CREATE POLICY "insert_own_cases" ON public.cases FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_cases" ON public.cases;
CREATE POLICY "update_own_cases" ON public.cases FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_cases" ON public.cases;
CREATE POLICY "delete_own_cases" ON public.cases FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ── locations ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text NOT NULL DEFAULT '',
  latitude double precision,
  longitude double precision,
  date_time timestamptz,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_locations" ON public.locations;
CREATE POLICY "select_own_locations" ON public.locations FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = locations.case_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_locations" ON public.locations;
CREATE POLICY "insert_own_locations" ON public.locations FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = locations.case_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_locations" ON public.locations;
CREATE POLICY "update_own_locations" ON public.locations FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = locations.case_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = locations.case_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_locations" ON public.locations;
CREATE POLICY "delete_own_locations" ON public.locations FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = locations.case_id AND c.user_id = auth.uid()));

-- ── evidence ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'other',
  source text NOT NULL DEFAULT '',
  evidence_date timestamptz,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  related_person_type text,
  related_person_id uuid,
  notes text NOT NULL DEFAULT '',
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','rejected')),
  file_path text,
  file_name text NOT NULL DEFAULT '',
  file_type text NOT NULL DEFAULT '',
  file_size_bytes integer NOT NULL DEFAULT 0,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_evidence" ON public.evidence;
CREATE POLICY "select_own_evidence" ON public.evidence FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = evidence.case_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_evidence" ON public.evidence;
CREATE POLICY "insert_own_evidence" ON public.evidence FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = evidence.case_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_evidence" ON public.evidence;
CREATE POLICY "update_own_evidence" ON public.evidence FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = evidence.case_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = evidence.case_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_evidence" ON public.evidence;
CREATE POLICY "delete_own_evidence" ON public.evidence FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = evidence.case_id AND c.user_id = auth.uid()));

-- ── suspects ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.suspects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact text NOT NULL DEFAULT '',
  id_reference text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.suspects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_suspects" ON public.suspects;
CREATE POLICY "select_own_suspects" ON public.suspects FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = suspects.case_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_suspects" ON public.suspects;
CREATE POLICY "insert_own_suspects" ON public.suspects FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = suspects.case_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_suspects" ON public.suspects;
CREATE POLICY "update_own_suspects" ON public.suspects FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = suspects.case_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = suspects.case_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_suspects" ON public.suspects;
CREATE POLICY "delete_own_suspects" ON public.suspects FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = suspects.case_id AND c.user_id = auth.uid()));

-- ── victims ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.victims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact text NOT NULL DEFAULT '',
  id_reference text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.victims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_victims" ON public.victims;
CREATE POLICY "select_own_victims" ON public.victims FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = victims.case_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_victims" ON public.victims;
CREATE POLICY "insert_own_victims" ON public.victims FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = victims.case_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_victims" ON public.victims;
CREATE POLICY "update_own_victims" ON public.victims FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = victims.case_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = victims.case_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_victims" ON public.victims;
CREATE POLICY "delete_own_victims" ON public.victims FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = victims.case_id AND c.user_id = auth.uid()));

-- ── witnesses ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.witnesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact text NOT NULL DEFAULT '',
  statement text NOT NULL DEFAULT '',
  statement_date timestamptz,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.witnesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_witnesses" ON public.witnesses;
CREATE POLICY "select_own_witnesses" ON public.witnesses FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = witnesses.case_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_witnesses" ON public.witnesses;
CREATE POLICY "insert_own_witnesses" ON public.witnesses FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = witnesses.case_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_witnesses" ON public.witnesses;
CREATE POLICY "update_own_witnesses" ON public.witnesses FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = witnesses.case_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = witnesses.case_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_witnesses" ON public.witnesses;
CREATE POLICY "delete_own_witnesses" ON public.witnesses FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = witnesses.case_id AND c.user_id = auth.uid()));

-- ── vehicles ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  registration_number text NOT NULL DEFAULT '',
  vehicle_type text NOT NULL DEFAULT '',
  make_model text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT '',
  owner_reference text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_vehicles" ON public.vehicles;
CREATE POLICY "select_own_vehicles" ON public.vehicles FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = vehicles.case_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_vehicles" ON public.vehicles;
CREATE POLICY "insert_own_vehicles" ON public.vehicles FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = vehicles.case_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_vehicles" ON public.vehicles;
CREATE POLICY "update_own_vehicles" ON public.vehicles FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = vehicles.case_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = vehicles.case_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_vehicles" ON public.vehicles;
CREATE POLICY "delete_own_vehicles" ON public.vehicles FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = vehicles.case_id AND c.user_id = auth.uid()));

-- ── case_events ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.case_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  event_date timestamptz NOT NULL,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  event_type text NOT NULL DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.case_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_case_events" ON public.case_events;
CREATE POLICY "select_own_case_events" ON public.case_events FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_events.case_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_case_events" ON public.case_events;
CREATE POLICY "insert_own_case_events" ON public.case_events FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_events.case_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_case_events" ON public.case_events;
CREATE POLICY "update_own_case_events" ON public.case_events FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_events.case_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_events.case_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_case_events" ON public.case_events;
CREATE POLICY "delete_own_case_events" ON public.case_events FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_events.case_id AND c.user_id = auth.uid()));

-- ── audit_logs ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  entity_type text NOT NULL DEFAULT '',
  entity_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_audit_logs" ON public.audit_logs;
CREATE POLICY "select_own_audit_logs" ON public.audit_logs FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = audit_logs.case_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_audit_logs" ON public.audit_logs;
CREATE POLICY "insert_own_audit_logs" ON public.audit_logs FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = audit_logs.case_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_audit_logs" ON public.audit_logs;
CREATE POLICY "update_own_audit_logs" ON public.audit_logs FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = audit_logs.case_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = audit_logs.case_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_audit_logs" ON public.audit_logs;
CREATE POLICY "delete_own_audit_logs" ON public.audit_logs FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = audit_logs.case_id AND c.user_id = auth.uid()));

-- ── indexes ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS cases_user_created_idx ON public.cases (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS evidence_case_idx ON public.evidence (case_id, created_at DESC);
CREATE INDEX IF NOT EXISTS locations_case_idx ON public.locations (case_id, created_at DESC);
CREATE INDEX IF NOT EXISTS suspects_case_idx ON public.suspects (case_id, created_at DESC);
CREATE INDEX IF NOT EXISTS victims_case_idx ON public.victims (case_id, created_at DESC);
CREATE INDEX IF NOT EXISTS witnesses_case_idx ON public.witnesses (case_id, created_at DESC);
CREATE INDEX IF NOT EXISTS vehicles_case_idx ON public.vehicles (case_id, created_at DESC);
CREATE INDEX IF NOT EXISTS case_events_case_idx ON public.case_events (case_id, event_date);
CREATE INDEX IF NOT EXISTS audit_logs_case_idx ON public.audit_logs (case_id, created_at DESC);

-- ── storage bucket for evidence files ──────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('case-evidence', 'case-evidence', false)
ON CONFLICT (id) DO NOTHING;