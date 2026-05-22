-- User tag preferences: save, follow, hide
CREATE TABLE IF NOT EXISTS user_tag_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  preference TEXT NOT NULL CHECK (preference IN ('saved', 'followed', 'hidden')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tag_id, preference)
);

CREATE INDEX IF NOT EXISTS idx_user_tag_prefs_user ON user_tag_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tag_prefs_tag ON user_tag_preferences(tag_id);

-- RLS
ALTER TABLE user_tag_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tag preferences"
  ON user_tag_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tag preferences"
  ON user_tag_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tag preferences"
  ON user_tag_preferences FOR DELETE
  USING (auth.uid() = user_id);
