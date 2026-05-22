-- Moderation system: audit log, moderator access, and notes

-- First, fix the book_proposals column name mismatch (user_id -> submitted_by for consistency)
ALTER TABLE book_proposals RENAME COLUMN user_id TO submitted_by;

-- Add moderator notes to book_proposals
ALTER TABLE book_proposals ADD COLUMN IF NOT EXISTS moderator_notes TEXT;
ALTER TABLE book_proposals ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);
ALTER TABLE book_proposals ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Add moderator notes to tag_proposals (check if table exists first)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tag_proposals') THEN
    ALTER TABLE tag_proposals ADD COLUMN IF NOT EXISTS moderator_notes TEXT;
    ALTER TABLE tag_proposals ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);
    ALTER TABLE tag_proposals ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
  END IF;
END $$;

-- Create moderation audit log
CREATE TABLE IF NOT EXISTS moderation_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  moderator_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('view', 'edit', 'approve', 'reject', 'save')),
  target_type TEXT NOT NULL CHECK (target_type IN ('book_proposal', 'tag_proposal', 'report')),
  target_id UUID NOT NULL,
  changes JSONB,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moderation_log_moderator ON moderation_log(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_log_target ON moderation_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_moderation_log_created ON moderation_log(created_at DESC);

ALTER TABLE moderation_log ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is moderator
CREATE OR REPLACE FUNCTION is_moderator(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id
    AND role IN ('moderator', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing restrictive policies and add moderator access for book_proposals
DROP POLICY IF EXISTS "Users can view own proposals" ON book_proposals;
DROP POLICY IF EXISTS "Users can insert proposals" ON book_proposals;

CREATE POLICY "Users can insert proposals" ON book_proposals
  FOR INSERT WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Users and moderators can view proposals" ON book_proposals
  FOR SELECT USING (
    auth.uid() = submitted_by
    OR is_moderator(auth.uid())
  );

CREATE POLICY "Moderators can update proposals" ON book_proposals
  FOR UPDATE USING (is_moderator(auth.uid()));

-- Same for proposal_authors
DROP POLICY IF EXISTS "Users can view own proposal authors" ON proposal_authors;
DROP POLICY IF EXISTS "Users can insert proposal authors" ON proposal_authors;

CREATE POLICY "Users can insert proposal authors" ON proposal_authors
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM book_proposals WHERE id = proposal_id AND submitted_by = auth.uid())
  );

CREATE POLICY "Users and moderators can view proposal authors" ON proposal_authors
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM book_proposals WHERE id = proposal_id AND submitted_by = auth.uid())
    OR is_moderator(auth.uid())
  );

CREATE POLICY "Moderators can update proposal authors" ON proposal_authors
  FOR UPDATE USING (is_moderator(auth.uid()));

CREATE POLICY "Moderators can delete proposal authors" ON proposal_authors
  FOR DELETE USING (is_moderator(auth.uid()));

CREATE POLICY "Moderators can insert proposal authors" ON proposal_authors
  FOR INSERT WITH CHECK (is_moderator(auth.uid()));

-- Same for proposal_links
DROP POLICY IF EXISTS "Users can view own proposal links" ON proposal_links;
DROP POLICY IF EXISTS "Users can insert proposal links" ON proposal_links;

CREATE POLICY "Users can insert proposal links" ON proposal_links
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM book_proposals WHERE id = proposal_id AND submitted_by = auth.uid())
  );

CREATE POLICY "Users and moderators can view proposal links" ON proposal_links
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM book_proposals WHERE id = proposal_id AND submitted_by = auth.uid())
    OR is_moderator(auth.uid())
  );

CREATE POLICY "Moderators can update proposal links" ON proposal_links
  FOR UPDATE USING (is_moderator(auth.uid()));

CREATE POLICY "Moderators can delete proposal links" ON proposal_links
  FOR DELETE USING (is_moderator(auth.uid()));

CREATE POLICY "Moderators can insert proposal links" ON proposal_links
  FOR INSERT WITH CHECK (is_moderator(auth.uid()));

-- Add moderator policies for tag_proposals if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tag_proposals') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own tag proposals" ON tag_proposals';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert tag proposals" ON tag_proposals';
    
    EXECUTE 'CREATE POLICY "Users can insert tag proposals" ON tag_proposals
      FOR INSERT WITH CHECK (auth.uid() = user_id)';
    
    EXECUTE 'CREATE POLICY "Users and moderators can view tag proposals" ON tag_proposals
      FOR SELECT USING (
        auth.uid() = user_id
        OR is_moderator(auth.uid())
      )';
    
    EXECUTE 'CREATE POLICY "Moderators can update tag proposals" ON tag_proposals
      FOR UPDATE USING (is_moderator(auth.uid()))';
  END IF;
END $$;

-- Moderation log policies
CREATE POLICY "Moderators can insert logs" ON moderation_log
  FOR INSERT WITH CHECK (is_moderator(auth.uid()));

CREATE POLICY "Moderators can view logs" ON moderation_log
  FOR SELECT USING (is_moderator(auth.uid()));
