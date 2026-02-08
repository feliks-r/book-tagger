import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import BookCover from "@/components/BookCover";
import BookshelfButton from "@/components/BookshelfButton";
import type { Series, Book } from "@/types";

type PageProps = {
  params: Promise<{ series_id: string }>;
};

type SeriesBook = Book & {
  series_index: number | null;
};

export default async function SeriesPage({ params }: PageProps) {
  const supabase = await createClient();
  const { series_id: seriesId } = await params;

  // Fetch series info
  const { data: series, error: seriesError } = await supabase
    .from("series")
    .select("id, name, created_at")
    .eq("id", seriesId)
    .single<Series>();

  if (seriesError || !series) {
    return <div className="p-8">Series not found.</div>;
  }

  // Fetch books in the series, ordered by series_index
  const { data: books, error: booksError } = await supabase
    .from("books")
    .select("id, title, author, description, publication_year, cover_id, series_id, series_index")
    .eq("series_id", seriesId)
    .order("series_index", { ascending: true, nullsFirst: false });

  if (booksError) {
    console.error("Failed to fetch series books:", booksError);
  }

  const seriesBooks: SeriesBook[] = (books as SeriesBook[]) || [];

  return (
    <div className="mx-auto max-w-4xl p-2 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground text-balance">{series.name}</h1>
        <p className="text-muted-foreground mt-1">
          {seriesBooks.length} {seriesBooks.length === 1 ? "book" : "books"} in this series
        </p>
      </div>

      <div className="border-t" />

      <div className="flex flex-col gap-4">
        {seriesBooks.map((book) => (
          <div
            key={book.id}
            className="flex gap-4 rounded-lg border p-4"
          >
            {/* Index number */}
            <div className="flex items-start pt-1 shrink-0 w-8">
              {book.series_index != null && (
                <span className="text-lg font-bold text-muted-foreground">
                  {book.series_index}
                </span>
              )}
            </div>

            {/* Cover */}
            <BookCover
              coverId={book.cover_id}
              title={book.title}
              author={book.author}
              size="M"
            />

            {/* Book info */}
            <div className="flex-1 min-w-0 flex flex-col">
              <Link
                href={`/books/${book.id}`}
                className="text-lg font-semibold text-foreground hover:underline leading-snug"
              >
                {book.title}
              </Link>
              <p className="text-sm text-muted-foreground mt-0.5">
                by {book.author}
              </p>
              {book.publication_year && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {book.publication_year}
                </p>
              )}
              {book.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                  {book.description}
                </p>
              )}
            </div>

            {/* Bookshelf button */}
            <div className="hidden sm:flex items-start shrink-0">
              <BookshelfButton bookId={book.id} />
            </div>
          </div>
        ))}
      </div>

      {seriesBooks.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No books found in this series.
        </p>
      )}
    </div>
  );
}
