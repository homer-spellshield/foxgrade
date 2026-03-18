-- Supabase Schema for Foxgrade

-- Custom Types
CREATE TYPE access_role AS ENUM ('Admin', 'Editor', 'Viewer');
CREATE TYPE doc_category AS ENUM ('Policy', 'Certificate', 'Report', 'Legal');
CREATE TYPE doc_access_level AS ENUM ('Public', 'Registered', 'NDA Required', 'Request Access');
CREATE TYPE request_status AS ENUM ('Pending', 'Approved', 'Rejected');

-- Organizations Table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  logo_url TEXT,
  brand_primary TEXT DEFAULT '#1A3D2E',
  brand_accent TEXT DEFAULT '#C9A84C',
  subdomain TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles Table (Extension of auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role access_role DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents Table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category doc_category NOT NULL,
  access_level doc_access_level NOT NULL,
  file_path TEXT NOT NULL,
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security Answers Table
CREATE TABLE security_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  section TEXT NOT NULL,
  question_id TEXT NOT NULL,
  answer_value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, section, question_id)
);

-- Subprocessors Table
CREATE TABLE subprocessors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  location TEXT NOT NULL,
  security_docs TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAQs Table
CREATE TABLE faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Access Requests Table
CREATE TABLE access_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doc_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  requester_email TEXT NOT NULL,
  reason TEXT,
  status request_status DEFAULT 'Pending',
  nda_signed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subprocessors ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Basic Policies
-- Organizations: Users can view and update their own organization. Public can view.
CREATE POLICY "Public can view organizations" ON organizations FOR SELECT USING (true);
CREATE POLICY "Users can update own organization" ON organizations FOR UPDATE USING (
  id IN (SELECT org_id FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'Editor'))
);

-- Profiles: Users can view profiles in their own organization
CREATE POLICY "Users can view org profiles" ON profiles FOR SELECT USING (
  org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
);

-- Documents: Public can view metadata. Org members can manage.
CREATE POLICY "Public can view documents" ON documents FOR SELECT USING (true);
CREATE POLICY "Org members can manage documents" ON documents FOR ALL USING (
  org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
);

-- Similar policies for the rest...
CREATE POLICY "Public can view answers" ON security_answers FOR SELECT USING (true);
CREATE POLICY "Org members can manage answers" ON security_answers FOR ALL USING (
  org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Public can view subprocessors" ON subprocessors FOR SELECT USING (true);
CREATE POLICY "Org members can manage subprocessors" ON subprocessors FOR ALL USING (
  org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Public can view faqs" ON faqs FOR SELECT USING (true);
CREATE POLICY "Org members can manage faqs" ON faqs FOR ALL USING (
  org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Org members can view access requests" ON access_requests FOR SELECT USING (
  org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "Public can insert access requests" ON access_requests FOR INSERT WITH CHECK (true);
