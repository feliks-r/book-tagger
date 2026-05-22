-- Add publication_year column to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS publication_year INTEGER;

-- Create an index for efficient year range queries
CREATE INDEX IF NOT EXISTS idx_books_publication_year ON books(publication_year);
