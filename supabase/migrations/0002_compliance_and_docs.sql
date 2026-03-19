-- Migration 2: Compliance, Frameworks, and Documents

-- Custom Enums
CREATE TYPE framework_type AS ENUM ('smb1001', 'essential_eight', 'nist_csf', 'pqc_readiness');
CREATE TYPE framework_status AS ENUM ('not_started', 'in_progress', 'achieved');
CREATE TYPE document_access_level AS ENUM ('public', 'registered', 'nda_required', 'request_access');
CREATE TYPE document_category AS ENUM ('policy', 'certificate', 'report', 'legal');

-- Security Profiles (Guided assessment answers per org)
CREATE TABLE security_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organisations(id) ON DELETE CASCADE NOT NULL,
  section TEXT NOT NULL,
  question_key TEXT NOT NULL,
  answer JSONB,
  framework_controls JSONB DEFAULT '[]'::jsonb, -- records which framework controls this answer satisfies
  evidence_urls TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, question_key)
);
CREATE TRIGGER set_security_profiles_updated_at BEFORE UPDATE ON security_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Compliance Frameworks (Org's overall posture)
CREATE TABLE compliance_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organisations(id) ON DELETE CASCADE NOT NULL,
  framework_type framework_type NOT NULL,
  status framework_status DEFAULT 'not_started',
  level_achieved TEXT, -- e.g. Bronze, ML2, Tier 3
  audited BOOLEAN DEFAULT FALSE,
  auditor_name TEXT,
  valid_from DATE,
  valid_to DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, framework_type)
);
CREATE TRIGGER set_compliance_frameworks_updated_at BEFORE UPDATE ON compliance_frameworks FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Framework Control Mappings (System dictionary of overlaps)
CREATE TABLE framework_control_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_framework framework_type,
  source_control TEXT,
  target_framework framework_type,
  target_control TEXT,
  mapping_rationale TEXT,
  UNIQUE(source_framework, source_control, target_framework, target_control)
);

-- Documents Table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organisations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category document_category NOT NULL,
  access_level document_access_level NOT NULL DEFAULT 'public',
  expiry_date DATE,
  file_path TEXT NOT NULL, -- points to Storage bucket
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER set_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Sub Processors (Vendors)
CREATE TABLE sub_processors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organisations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  location TEXT NOT NULL,
  security_certs TEXT[],
  vendor_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER set_sub_processors_updated_at BEFORE UPDATE ON sub_processors FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- FAQs
CREATE TABLE faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organisations(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER set_faqs_updated_at BEFORE UPDATE ON faqs FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Pentest Summaries
CREATE TABLE pentest_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organisations(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  provider TEXT NOT NULL,
  scope TEXT NOT NULL,
  methodology TEXT,
  findings_status TEXT,
  report_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER set_pentest_summaries_updated_at BEFORE UPDATE ON pentest_summaries FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE security_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE framework_control_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_processors ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pentest_summaries ENABLE ROW LEVEL SECURITY;

-- Security Profiles Policies
CREATE POLICY "Org members can read own security profiles" ON security_profiles FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "Org members can edit own security profiles" ON security_profiles FOR UPDATE USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('Admin', 'Editor')));
CREATE POLICY "Org members can insert own security profiles" ON security_profiles FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('Admin', 'Editor')));

-- Documents Policies
CREATE POLICY "Org members can read docs" ON documents FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "Org members can manage docs" ON documents FOR ALL USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('Admin', 'Editor')));
CREATE POLICY "Public can view active doc metadata" ON documents FOR SELECT USING (org_id IN (SELECT id FROM organisations WHERE trust_centre_live = TRUE));

-- Frameworks, Vendors, FAQs, Pentests policies mostly follow standard public read/org write structure.
CREATE POLICY "Public can view active frameworks" ON compliance_frameworks FOR SELECT USING (org_id IN (SELECT id FROM organisations WHERE trust_centre_live = TRUE));
CREATE POLICY "Org members manage frameworks" ON compliance_frameworks FOR ALL USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('Admin', 'Editor')));

CREATE POLICY "Public can view active subprocessors" ON sub_processors FOR SELECT USING (org_id IN (SELECT id FROM organisations WHERE trust_centre_live = TRUE));
CREATE POLICY "Org members manage subprocessors" ON sub_processors FOR ALL USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('Admin', 'Editor')));

CREATE POLICY "Public can view active faqs" ON faqs FOR SELECT USING (org_id IN (SELECT id FROM organisations WHERE trust_centre_live = TRUE));
CREATE POLICY "Org members manage faqs" ON faqs FOR ALL USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('Admin', 'Editor')));

CREATE POLICY "Public can view active pentests" ON pentest_summaries FOR SELECT USING (org_id IN (SELECT id FROM organisations WHERE trust_centre_live = TRUE));
CREATE POLICY "Org members manage pentests" ON pentest_summaries FOR ALL USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('Admin', 'Editor')));
