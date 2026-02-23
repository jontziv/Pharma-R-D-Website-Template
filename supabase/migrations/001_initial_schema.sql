-- ============================================================
-- PharmaLab R&D Platform — Initial Schema
-- Run in: Supabase SQL Editor
-- Order: 001 (run first)
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Profiles (extends auth.users) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT        NOT NULL,
  full_name       TEXT,
  role            TEXT        NOT NULL DEFAULT 'scientist'
                              CHECK (role IN ('scientist', 'lab_manager', 'reviewer')),
  institution     TEXT,
  avatar_initials TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Experiments ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.experiments (
  id              TEXT        PRIMARY KEY,                        -- EXP-XXXX
  name            TEXT        NOT NULL,
  category        TEXT        NOT NULL,
  phase           TEXT,
  status          TEXT        NOT NULL DEFAULT 'In Progress'
                              CHECK (status IN ('In Progress','Completed','Pending Review','On Hold')),
  priority        TEXT        NOT NULL DEFAULT 'Medium'
                              CHECK (priority IN ('High','Medium','Low')),
  researcher_id   UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  researcher_name TEXT,
  tags            TEXT[]      NOT NULL DEFAULT '{}',
  description     TEXT,
  hypothesis      TEXT,
  started_at      DATE,
  due_date        DATE,
  completed_at    DATE,
  progress        INTEGER     NOT NULL DEFAULT 0
                              CHECK (progress BETWEEN 0 AND 100),
  organization    TEXT,                                           -- PII field
  created_by      UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Experiment Timeline Events ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.experiment_timeline_events (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id   TEXT        NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
  title           TEXT        NOT NULL,
  description     TEXT,
  event_type      TEXT        NOT NULL DEFAULT 'note'
                              CHECK (event_type IN ('milestone','data_collection','analysis','review','note','status_change')),
  event_date      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Experiment Data Files ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.experiment_data_files (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id   TEXT        NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
  file_name       TEXT        NOT NULL,
  file_size       BIGINT,
  file_type       TEXT,
  storage_path    TEXT        NOT NULL,
  description     TEXT,
  uploaded_by     UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Lab Notes ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lab_notes (
  id              TEXT        PRIMARY KEY,                        -- NB-YYYY-NNN
  title           TEXT        NOT NULL,
  content         TEXT        NOT NULL DEFAULT '',
  experiment_id   TEXT        REFERENCES public.experiments(id) ON DELETE SET NULL,
  researcher_id   UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  tags            TEXT[]      NOT NULL DEFAULT '{}',
  has_attachments BOOLEAN     NOT NULL DEFAULT FALSE,
  has_images      BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Samples ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.samples (
  id              TEXT        PRIMARY KEY,                        -- SMP-XXXX
  name            TEXT        NOT NULL,
  type            TEXT        NOT NULL,
  experiment_id   TEXT        REFERENCES public.experiments(id) ON DELETE SET NULL,
  batch           TEXT,
  volume          TEXT,
  concentration   TEXT,
  storage         TEXT,
  location        TEXT,
  status          TEXT        NOT NULL DEFAULT 'Active'
                              CHECK (status IN ('Active','Depleted','Low Stock','Quarantine')),
  expiry_month    TEXT,
  received_at     DATE,
  quantity        INTEGER     NOT NULL DEFAULT 0,
  max_quantity    INTEGER     NOT NULL DEFAULT 100,
  patient_id      TEXT,                                           -- PII field
  organization    TEXT,                                           -- PII field
  created_by      UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Protocols ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.protocols (
  id              TEXT        PRIMARY KEY,                        -- SOP-XXX-NNN
  title           TEXT        NOT NULL,
  category        TEXT        NOT NULL,
  version         TEXT,
  status          TEXT        NOT NULL DEFAULT 'Approved'
                              CHECK (status IN ('Approved','Under Review','Expired')),
  author_id       UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name     TEXT,
  description     TEXT,
  content         TEXT,
  tags            TEXT[]      NOT NULL DEFAULT '{}',
  usage_count     INTEGER     NOT NULL DEFAULT 0,
  review_due      DATE,
  starred         BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Trigger: auto-update updated_at ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_profiles_updated_at      BEFORE UPDATE ON public.profiles      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  CREATE TRIGGER trg_experiments_updated_at   BEFORE UPDATE ON public.experiments   FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  CREATE TRIGGER trg_lab_notes_updated_at     BEFORE UPDATE ON public.lab_notes     FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  CREATE TRIGGER trg_samples_updated_at       BEFORE UPDATE ON public.samples       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  CREATE TRIGGER trg_protocols_updated_at     BEFORE UPDATE ON public.protocols     FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Trigger: auto-create profile on signup ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, avatar_initials)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'scientist'),
    upper(left(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 2))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Storage bucket ────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'experiment-files',
  'experiment-files',
  FALSE,
  52428800,   -- 50 MB per file
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'text/plain',
    'image/png',
    'image/jpeg',
    'image/tiff',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;
