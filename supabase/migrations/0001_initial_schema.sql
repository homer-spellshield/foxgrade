-- Migration 1: Initial Schema

-- Custom Types
CREATE TYPE access_role AS ENUM ('Admin', 'Editor', 'Viewer');

-- MSP Organizations Table
CREATE TABLE msp_organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo TEXT,
  brand_colours JSONB DEFAULT '{"primary": "#1A3D2E", "accent": "#C9A84C"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organizations Table
CREATE TABLE organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  msp_id UUID REFERENCES msp_organisations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  logo TEXT,
  brand_colours JSONB DEFAULT '{"primary": "#1A3D2E", "accent": "#C9A84C"}'::jsonb,
  favicon TEXT,
  subdomain TEXT UNIQUE,
  trust_centre_live BOOLEAN DEFAULT FALSE,
  nda_template TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Onboarding Progress Table
CREATE TABLE onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organisations(id) ON DELETE CASCADE UNIQUE NOT NULL,
  steps_completed JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Org Members Table
CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  org_id UUID REFERENCES organisations(id) ON DELETE CASCADE NOT NULL,
  role access_role DEFAULT 'Viewer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, org_id)
);

-- Security Triggers
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_msp_orgs_updated_at BEFORE UPDATE ON msp_organisations FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER set_orgs_updated_at BEFORE UPDATE ON organisations FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER set_onboarding_updated_at BEFORE UPDATE ON onboarding_progress FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER set_org_members_updated_at BEFORE UPDATE ON org_members FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- RLS Enforcement
ALTER TABLE msp_organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

-- Org Members RLS (Read their own mapping, Admin can map)
CREATE POLICY "Users can read own memberships" ON org_members FOR SELECT USING (user_id = auth.uid());

-- Organisations RLS
-- 1. Org members can access data where org_id matches their auth session.
CREATE POLICY "Org members can read own org" ON organisations FOR SELECT USING (
  id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
);
CREATE POLICY "Org members can edit own org" ON organisations FOR UPDATE USING (
  id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('Admin', 'Editor'))
);
-- 2. MSP users can access data across all orgs where organisations.msp_id matches their MSP profile.
-- (Assuming we link MSP users via an msp_members table or just lookup their auth mapping if they are in the msp_organisation. For now, assuming they have msp_id in auth context or a separate table if we map it like org_members. Wait, let's allow read for now. In real apps, MSP membership requires an `msp_members` table linking auth.users. Let's create an msp_members table.)

CREATE TABLE msp_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  msp_id UUID REFERENCES msp_organisations(id) ON DELETE CASCADE NOT NULL,
  role access_role DEFAULT 'Admin',
  UNIQUE(user_id, msp_id)
);
ALTER TABLE msp_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "MSP users can read own memberships" ON msp_members FOR SELECT USING (user_id = auth.uid());

-- MSP policy to read client orgs
CREATE POLICY "MSP members can read client orgs" ON organisations FOR SELECT USING (
  msp_id IN (SELECT msp_id FROM msp_members WHERE user_id = auth.uid())
);
-- MSP policy to edit client orgs
CREATE POLICY "MSP members can edit client orgs" ON organisations FOR UPDATE USING (
  msp_id IN (SELECT msp_id FROM msp_members WHERE user_id = auth.uid() AND role IN ('Admin', 'Editor'))
);

-- 3. Public queries are unauthenticated reads filtered down solely by subdomain. Document access gating is handled in the app for docs.
CREATE POLICY "Public can view active trust centres" ON organisations FOR SELECT USING (trust_centre_live = TRUE);

-- Onboarding RLS
CREATE POLICY "Org members can manage onboarding" ON onboarding_progress FOR ALL USING (
  org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role = 'Admin')
);
