import { createClient } from "@/lib/supabase/server";
import Link from 'next/link';
import { ExternalLink } from "lucide-react";

import TagSection from "@/components/TagSection";
import BookshelfButton from "@/components/BookshelfButton";
import BookCover from "@/components/BookCover";
import ExpandableText from "@/components/ExpandableText";
import { parseAuthorsJoin, formatAuthors } from "@/lib/authors";

import type { Book, BookTagWithVotes, BookLink, Author } from "@/types";

type PageProps = { 
  params: Promise<{ book_id: string }>;
};

export default async function BookPage({ params }: PageProps) {
  const supabase = await createClient();
  const { book_id: bookId } = await params;

  // ------------------------------------------------------------
  // Fetch book
  const { data: rawBook, error: bookError } = await supabase
    .from("books")
    .select("id, title, description, cover_id, series_id, series_index, publication_year, book_authors(display_order, authors(id, name))")
    .eq("id", bookId)
    .single();

  if (bookError || !rawBook) {
    return <div className="p-8">Book not found.</div>;
  }

  const authors: Author[] = parseAuthorsJoin((rawBook as any).book_authors);
  const authorsText = formatAuthors(authors);
  const book = { ...rawBook, authors };

  // ------------------------------------------------------------
  // Fetch series name if book belongs to a series
  let seriesName: string | null = null;
  if (book.series_id) {
    const { data: seriesData } = await supabase
      .from("series")
      .select("name")
      .eq("id", book.series_id)
      .single();
    seriesName = seriesData?.name ?? null;
  }

  // ------------------------------------------------------------
  // Fetch tags with score and user vote
  const { data: tags, error: tagsError } = await supabase
    .rpc("get_book_tags_with_votes", { p_book_id: bookId })
    .overrideTypes<BookTagWithVotes[], { merge: false }>();

  if (tagsError) {
    console.error("Failed to fetch tags:", tagsError);
  }

  const allTags: BookTagWithVotes[] = tags as BookTagWithVotes[];

  // ------------------------------------------------------------
  // Fetch links
  const { data: links } = await supabase
    .from("book_links")
    .select("*")
    .eq("book_id", bookId);

  const bookLinks: BookLink[] = (links as BookLink[]) || [];

  // ------------------------------------------------------------
  // Group by category
  type GroupedCategory = {
    categoryId: string;
    categoryName: string;
    displayOrder: number;
    tags: BookTagWithVotes[];
  };

  const groupedMap: Record<string, GroupedCategory> = {};

  allTags.forEach((tag) => {
    const cat = tag.category_id;
    if (!cat) return;

    if (!groupedMap[cat]) {
      groupedMap[cat] = {
        categoryId: cat,
        categoryName: tag.category_name,
        displayOrder: tag.category_display_order,
        tags: [],
      };
    }

    groupedMap[cat].tags.push(tag);
  });

  // ------------------------------------------------------------
  // Render
  return (
    <div className="mx-auto max-w-6xl p-2 md:p-8 space-y-6 mt-0">
      
      {/* Book */}
      <div className="flex flex-col md:flex-row mt-0">

        {/* Left column: cover + links (desktop) */}
        <div className="flex flex-col items-center gap-3 m-auto mt-0 mb-4 md:m-0 shrink-0">
          <BookCover
            coverId={book.cover_id}
            title={book.title}
            author={authorsText}
            size="L"
          />
          {/* Links - desktop only, below cover */}
          {bookLinks.length > 0 && (
            <div className="hidden md:flex flex-col gap-1.5 w-full">
              <h3 className="text-sm font-semibold text-foreground">Links</h3>
              {bookLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-secondary-foreground hover:text-primary hover:underline transition-all"
                >
                  {link.label}
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Right column: title, shelf button, description */}
        <div className="flex flex-col mx-0 md:mx-8 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              {seriesName && (
                <p className="text-lg text-muted-foreground text-center md:text-left">
                  <Link href={`/series/${book.series_id}`} className="hover:underline transition-all">
                    {seriesName}
                  </Link>
                  {book.series_index && ` #${book.series_index}`}
                </p>
              )}
              <h1 className="text-3xl font-bold mb-1 text-center md:text-left">{book.title}</h1>
              <p className="text-lg text-muted-foreground mb-3 text-center md:text-left">
                {"by "}
                {authors.map((a, i) => (
                  <span key={a.id}>
                    {i > 0 && (i === authors.length - 1 ? " and " : ", ")}
                    <Link href={`/authors/${a.id}`} className="font-medium hover:underline transition-all">{a.name}</Link>
                  </span>
                ))}
              </p>
              <p className="text-sm text-muted-foreground mb-5 text-center md:text-left whitespace-pre-wrap">
                  fiction  |  novel  |  {book.publication_year}
              </p>
            </div>
            {/* Bookshelf button - top right on desktop */}
            <div className="hidden md:block shrink-0">
              <BookshelfButton bookId={book.id} />
            </div>
          </div>

          {/* Bookshelf button - above description on mobile */}
          <div className="flex justify-center mb-4 md:hidden">
            <BookshelfButton bookId={book.id} />
          </div>

          {book.description && (
            <ExpandableText text={book.description} maxLines={6} />
          )}

          {/* Links - mobile only, below description */}
          {bookLinks.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-4 md:hidden">
              <h3 className="text-sm font-semibold text-foreground">Links</h3>
              {bookLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-secondary-foreground hover:text-primary hover:underline"
                >
                  {link.label}
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border" />
      
      {/* Tags */}
      <div>
        <h2 className="text-xl font-semibold mb-0 inline-block">Community Tags</h2>
        <TagSection
          bookId={book.id}
          initialTags={allTags}
        />
      </div>
    </div>
  );
}
