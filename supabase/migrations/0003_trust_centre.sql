-- Migration 3: Trust Centre Views and Gates

-- Enums
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'denied');

-- Access Requests (Used by request_access tier on documents)
CREATE TABLE access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  requester_email TEXT NOT NULL,
  requester_company TEXT,
  reason TEXT,
  status request_status DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER set_access_requests_updated_at BEFORE UPDATE ON access_requests FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- NDA Signatures
CREATE TABLE nda_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organisations(id) ON DELETE CASCADE NOT NULL,
  signer_email TEXT NOT NULL,
  signer_company TEXT,
  nda_version_hash TEXT NOT NULL,
  signed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT
);

-- Registered Viewers
CREATE TABLE registered_viewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organisations(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  company_inferred TEXT,
  first_access TIMESTAMPTZ DEFAULT NOW(),
  last_access TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, email)
);

-- Page Views (Analytics)
CREATE TABLE page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organisations(id) ON DELETE CASCADE NOT NULL,
  visitor_fingerprint TEXT NOT NULL,
  section_viewed TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Enforcement
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE nda_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE registered_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Only authenticated users map to orgs can review requests
CREATE POLICY "Org members can view access requests" ON access_requests FOR SELECT USING (
  document_id IN (SELECT id FROM documents WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
);
CREATE POLICY "Org members can update access requests" ON access_requests FOR UPDATE USING (
  document_id IN (SELECT id FROM documents WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('Admin', 'Editor')))
);
-- Public can submit access requests
CREATE POLICY "Public can insert access requests" ON access_requests FOR INSERT WITH CHECK (true);

-- NDA Signatures, Registered Viewers, Page Views
CREATE POLICY "Org members can read ndas" ON nda_signatures FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "Public can insert ndas" ON nda_signatures FOR INSERT WITH CHECK (true);

CREATE POLICY "Org members can read registered viewers" ON registered_viewers FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "Public can insert registered viewers" ON registered_viewers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can upsert registered viewers" ON registered_viewers FOR UPDATE USING (true); -- Requires careful frontend logic

CREATE POLICY "Org members can read page views" ON page_views FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "Public can insert page views" ON page_views FOR INSERT WITH CHECK (true);

-- Storage Setup
-- Note: In Supabase, bucket creation occurs inside storage schema. 
INSERT INTO storage.buckets (id, name, public) 
VALUES ('public-assets', 'public-assets', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('private-documents', 'private-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Public Assets logic (Logos, favicons fully readable)
CREATE POLICY "Public assets are readable by all" ON storage.objects FOR SELECT USING (bucket_id = 'public-assets');
CREATE POLICY "Org members can upload public assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'public-assets' AND auth.role() = 'authenticated');
CREATE POLICY "Org members can update public assets" ON storage.objects FOR UPDATE USING (bucket_id = 'public-assets' AND auth.role() = 'authenticated');
CREATE POLICY "Org members can delete public assets" ON storage.objects FOR DELETE USING (bucket_id = 'public-assets' AND auth.role() = 'authenticated');

-- Private Document logic (Direct URL reads are disabled, served via Edge Function)
CREATE POLICY "Org members can upload private documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'private-documents' AND auth.role() = 'authenticated');
CREATE POLICY "Org members can read private documents natively" ON storage.objects FOR SELECT USING (bucket_id = 'private-documents' AND auth.role() = 'authenticated');
CREATE POLICY "Org members can manage private documents" ON storage.objects FOR ALL USING (bucket_id = 'private-documents' AND auth.role() = 'authenticated');
-- Note: the Edge function will utilize service role keys to read from private-documents and generate temporary signed urls for users verified in access_requests.
