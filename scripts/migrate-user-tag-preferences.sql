-- Migrate user_tag_preferences from multi-row to single-row-per-user-tag design
DROP TABLE IF EXISTS user_tag_preferences;

CREATE TABLE user_tag_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  is_saved BOOLEAN NOT NULL DEFAULT false,
  is_followed BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tag_id)
);

CREATE INDEX idx_user_tag_prefs_user ON user_tag_preferences(user_id);
CREATE INDEX idx_user_tag_prefs_tag ON user_tag_preferences(tag_id);

ALTER TABLE user_tag_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tag preferences"
  ON user_tag_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tag preferences"
  ON user_tag_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tag preferences"
  ON user_tag_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tag preferences"
  ON user_tag_preferences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
