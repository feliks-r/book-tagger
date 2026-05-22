-- Create authors table
CREATE TABLE IF NOT EXISTS authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Create book_authors join table
CREATE TABLE IF NOT EXISTS book_authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  UNIQUE(book_id, author_id)
);

CREATE INDEX IF NOT EXISTS idx_book_authors_book_id ON book_authors(book_id);
CREATE INDEX IF NOT EXISTS idx_book_authors_author_id ON book_authors(author_id);

-- Migrate existing author data from books.author column
-- Insert unique authors
INSERT INTO authors (name)
SELECT DISTINCT author FROM books
WHERE author IS NOT NULL AND author != ''
ON CONFLICT (name) DO NOTHING;

-- Create book_authors links
INSERT INTO book_authors (book_id, author_id, display_order)
SELECT b.id, a.id, 0
FROM books b
JOIN authors a ON a.name = b.author
WHERE b.author IS NOT NULL AND b.author != ''
ON CONFLICT (book_id, author_id) DO NOTHING;

-- Drop the old author column
ALTER TABLE books DROP COLUMN IF EXISTS author;
