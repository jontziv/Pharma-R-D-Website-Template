-- ============================================================
-- PharmaLab R&D Platform — Row Level Security Policies
-- Run in: Supabase SQL Editor
-- Order: 002 (run after 001)
-- ============================================================

-- ── Helper: get current user role ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── Enable RLS ────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_data_files     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_notes                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.samples                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocols                 ENABLE ROW LEVEL SECURITY;

-- ── Drop existing policies (idempotent) ──────────────────────────────────────
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- PROFILES
-- ═══════════════════════════════════════════════════════════════
-- All authenticated users can read all profiles (needed for showing researcher names)
CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can only update their own profile; lab_managers can update any
CREATE POLICY "profiles_update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR get_user_role() = 'lab_manager')
  WITH CHECK (id = auth.uid() OR get_user_role() = 'lab_manager');

-- Service role / triggers handle INSERT (via handle_new_user trigger)

-- ═══════════════════════════════════════════════════════════════
-- EXPERIMENTS
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "experiments_select"
  ON public.experiments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "experiments_insert"
  ON public.experiments FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND get_user_role() IN ('scientist', 'lab_manager')
  );

CREATE POLICY "experiments_update"
  ON public.experiments FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR get_user_role() = 'lab_manager')
  WITH CHECK (created_by = auth.uid() OR get_user_role() = 'lab_manager');

-- Only lab managers can delete experiments
CREATE POLICY "experiments_delete"
  ON public.experiments FOR DELETE
  TO authenticated
  USING (get_user_role() = 'lab_manager');

-- ═══════════════════════════════════════════════════════════════
-- EXPERIMENT TIMELINE EVENTS
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "timeline_select"
  ON public.experiment_timeline_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "timeline_insert"
  ON public.experiment_timeline_events FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND get_user_role() IN ('scientist', 'lab_manager')
  );

CREATE POLICY "timeline_update"
  ON public.experiment_timeline_events FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR get_user_role() = 'lab_manager');

CREATE POLICY "timeline_delete"
  ON public.experiment_timeline_events FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() OR get_user_role() = 'lab_manager');

-- ═══════════════════════════════════════════════════════════════
-- EXPERIMENT DATA FILES
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "datafiles_select"
  ON public.experiment_data_files FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "datafiles_insert"
  ON public.experiment_data_files FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND get_user_role() IN ('scientist', 'lab_manager')
  );

CREATE POLICY "datafiles_delete"
  ON public.experiment_data_files FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid() OR get_user_role() = 'lab_manager');

-- ═══════════════════════════════════════════════════════════════
-- LAB NOTES
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "lab_notes_select"
  ON public.lab_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "lab_notes_insert"
  ON public.lab_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    researcher_id = auth.uid()
    AND get_user_role() IN ('scientist', 'lab_manager')
  );

CREATE POLICY "lab_notes_update"
  ON public.lab_notes FOR UPDATE
  TO authenticated
  USING (researcher_id = auth.uid() OR get_user_role() = 'lab_manager')
  WITH CHECK (researcher_id = auth.uid() OR get_user_role() = 'lab_manager');

CREATE POLICY "lab_notes_delete"
  ON public.lab_notes FOR DELETE
  TO authenticated
  USING (researcher_id = auth.uid() OR get_user_role() = 'lab_manager');

-- ═══════════════════════════════════════════════════════════════
-- SAMPLES
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "samples_select"
  ON public.samples FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "samples_insert"
  ON public.samples FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND get_user_role() IN ('scientist', 'lab_manager')
  );

CREATE POLICY "samples_update"
  ON public.samples FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR get_user_role() = 'lab_manager')
  WITH CHECK (created_by = auth.uid() OR get_user_role() = 'lab_manager');

CREATE POLICY "samples_delete"
  ON public.samples FOR DELETE
  TO authenticated
  USING (get_user_role() = 'lab_manager');

-- ═══════════════════════════════════════════════════════════════
-- PROTOCOLS
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "protocols_select"
  ON public.protocols FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "protocols_insert"
  ON public.protocols FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND get_user_role() IN ('scientist', 'lab_manager')
  );

CREATE POLICY "protocols_update"
  ON public.protocols FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid() OR get_user_role() = 'lab_manager')
  WITH CHECK (author_id = auth.uid() OR get_user_role() = 'lab_manager');

CREATE POLICY "protocols_delete"
  ON public.protocols FOR DELETE
  TO authenticated
  USING (get_user_role() = 'lab_manager');

-- ═══════════════════════════════════════════════════════════════
-- STORAGE (experiment-files bucket)
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "storage_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'experiment-files');

CREATE POLICY "storage_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'experiment-files'
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('scientist', 'lab_manager')
  );

CREATE POLICY "storage_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'experiment-files'
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('scientist', 'lab_manager')
  );

CREATE POLICY "storage_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'experiment-files'
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'lab_manager'
  );
