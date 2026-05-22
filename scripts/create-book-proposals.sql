-- Book proposals tables
CREATE TABLE IF NOT EXISTS book_proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  publication_year INTEGER,
  series_id UUID REFERENCES series(id),
  proposed_series_name TEXT,
  series_index NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS proposal_authors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES book_proposals(id) ON DELETE CASCADE,
  author_id UUID REFERENCES authors(id),
  proposed_author_name TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT author_reference CHECK (author_id IS NOT NULL OR proposed_author_name IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS proposal_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES book_proposals(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_book_proposals_user ON book_proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_book_proposals_status ON book_proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposal_authors_proposal ON proposal_authors(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_links_proposal ON proposal_links(proposal_id);

ALTER TABLE book_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert proposals" ON book_proposals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own proposals" ON book_proposals FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert proposal authors" ON proposal_authors FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM book_proposals WHERE id = proposal_id AND user_id = auth.uid())
);
CREATE POLICY "Users can view own proposal authors" ON proposal_authors FOR SELECT USING (
  EXISTS (SELECT 1 FROM book_proposals WHERE id = proposal_id AND user_id = auth.uid())
);

CREATE POLICY "Users can insert proposal links" ON proposal_links FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM book_proposals WHERE id = proposal_id AND user_id = auth.uid())
);
CREATE POLICY "Users can view own proposal links" ON proposal_links FOR SELECT USING (
  EXISTS (SELECT 1 FROM book_proposals WHERE id = proposal_id AND user_id = auth.uid())
);
