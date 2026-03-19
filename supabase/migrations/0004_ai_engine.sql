-- Migration 4: AI Engine (RESPOND Pillar)

-- Custom Enums
CREATE TYPE questionnaire_status AS ENUM ('processing', 'draft', 'in_review', 'completed');
CREATE TYPE response_confidence AS ENUM ('high', 'medium', 'low', 'needs_review');
CREATE TYPE response_status AS ENUM ('draft', 'approved', 'edited', 'flagged');

-- Questionnaire Uploads
CREATE TABLE questionnaire_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organisations(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  status questionnaire_status DEFAULT 'processing',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER set_questionnaire_uploads_updated BEFORE UPDATE ON questionnaire_uploads FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Questionnaire Responses
CREATE TABLE questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID REFERENCES questionnaire_uploads(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  draft_answer TEXT,
  confidence response_confidence,
  source_citations JSONB DEFAULT '[]'::jsonb,
  status response_status DEFAULT 'draft',
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER set_questionnaire_responses_updated BEFORE UPDATE ON questionnaire_responses FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Knowledge Base Entries with native PostgreSQL tsvector full-text search
CREATE TABLE knowledge_base_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organisations(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  source_type TEXT NOT NULL, -- 'security_profile', 'questionnaire_response', 'manual'
  source_id TEXT NOT NULL,
  search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(content, ''))) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, source_type, source_id)
);
CREATE INDEX idx_kb_search_vector ON knowledge_base_entries USING GIN(search_vector);
CREATE TRIGGER set_kb_entries_updated_at BEFORE UPDATE ON knowledge_base_entries FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Trigger: Map security_profiles saves directly into knowledge_base_entries
CREATE OR REPLACE FUNCTION sync_security_profile_to_kb()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.answer IS NOT NULL THEN
    INSERT INTO knowledge_base_entries (org_id, content, source_type, source_id)
    VALUES (
      NEW.org_id, 
      NEW.question_key || ': ' || NEW.answer::text, 
      'security_profile', 
      NEW.question_key
    )
    ON CONFLICT (org_id, source_type, source_id) 
    DO UPDATE SET content = EXCLUDED.content, updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_security_profile_to_kb_trigger
AFTER INSERT OR UPDATE ON security_profiles
FOR EACH ROW EXECUTE PROCEDURE sync_security_profile_to_kb();

-- Trigger: Map approved questionnaire_responses into knowledge_base_entries (Data Flywheel)
CREATE OR REPLACE FUNCTION sync_approved_response_to_kb()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND NEW.draft_answer IS NOT NULL THEN
    INSERT INTO knowledge_base_entries (org_id, content, source_type, source_id)
    SELECT org_id, NEW.question_text || ': ' || NEW.draft_answer, 'questionnaire_response', NEW.id::text
    FROM questionnaire_uploads WHERE id = NEW.questionnaire_id
    ON CONFLICT (org_id, source_type, source_id)
    DO UPDATE SET content = EXCLUDED.content, updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_approved_response_to_kb_trigger
AFTER INSERT OR UPDATE ON questionnaire_responses
FOR EACH ROW EXECUTE PROCEDURE sync_approved_response_to_kb();

-- RLS Enforcement
ALTER TABLE questionnaire_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members read questionnaires" ON questionnaire_uploads FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "Org members manage questionnaires" ON questionnaire_uploads FOR ALL USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('Admin', 'Editor')));

CREATE POLICY "Org members read responses" ON questionnaire_responses FOR SELECT USING (
  questionnaire_id IN (SELECT id FROM questionnaire_uploads WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
);
CREATE POLICY "Org members manage responses" ON questionnaire_responses FOR ALL USING (
  questionnaire_id IN (SELECT id FROM questionnaire_uploads WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('Admin', 'Editor')))
);

CREATE POLICY "Org members read kb" ON knowledge_base_entries FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "Org members manage kb" ON knowledge_base_entries FOR ALL USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('Admin', 'Editor')));
