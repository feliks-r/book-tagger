-- Create bookshelves table
CREATE TABLE IF NOT EXISTS bookshelves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Each user can only have one shelf with a given name
  UNIQUE(user_id, name)
);

-- Create bookshelf_books junction table
CREATE TABLE IF NOT EXISTS bookshelf_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bookshelf_id UUID NOT NULL REFERENCES bookshelves(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- A book can only be on a shelf once
  UNIQUE(bookshelf_id, book_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_bookshelves_user_id ON bookshelves(user_id);
CREATE INDEX IF NOT EXISTS idx_bookshelf_books_bookshelf_id ON bookshelf_books(bookshelf_id);
CREATE INDEX IF NOT EXISTS idx_bookshelf_books_book_id ON bookshelf_books(book_id);

-- Create function to create default shelves for new users
CREATE OR REPLACE FUNCTION create_default_bookshelves()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO bookshelves (user_id, name, display_order)
  VALUES 
    (NEW.id, 'Read', 0),
    (NEW.id, 'Want to Read', 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_bookshelves ON auth.users;
CREATE TRIGGER on_auth_user_created_bookshelves
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_bookshelves();

-- Enable RLS
ALTER TABLE bookshelves ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookshelf_books ENABLE ROW LEVEL SECURITY;

-- RLS policies for bookshelves
CREATE POLICY "Users can view their own bookshelves"
  ON bookshelves FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookshelves"
  ON bookshelves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookshelves"
  ON bookshelves FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookshelves"
  ON bookshelves FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for bookshelf_books
CREATE POLICY "Users can view books on their shelves"
  ON bookshelf_books FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookshelves 
      WHERE bookshelves.id = bookshelf_books.bookshelf_id 
      AND bookshelves.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add books to their shelves"
  ON bookshelf_books FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookshelves 
      WHERE bookshelves.id = bookshelf_books.bookshelf_id 
      AND bookshelves.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove books from their shelves"
  ON bookshelf_books FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM bookshelves 
      WHERE bookshelves.id = bookshelf_books.bookshelf_id 
      AND bookshelves.user_id = auth.uid()
    )
  );
