import { createClient } from "@/lib/supabase/server";
import TagSection from "@/components/TagSection";
import type { Book, BookTagWithVotes } from "@/types";
import Link from 'next/link'

type PageProps = { 
  params: Promise<{ book_id: string }>;
};

export default async function BookPage({ params }: PageProps) {
  const supabase = await createClient();
  const { book_id: bookId } = await params;

  // ------------------------------------------------------------
  // Fetch book
  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("id, title, author, description, publication_year, series_index, series:series_id (id, name)")
    .eq("id", bookId)
    .single<Book>();

  if (bookError || !book) {
    return <div className="p-8">Book not found.</div>;
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

  console.log(tags);

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
      
      {/* Title */}
      <div className="flex flex-col md:flex-row mt-0">
        {/* <div className="bg-gray-200 w-45 min-w-45 h-60 rounded-sm m-auto mt-0 mb-4 md:m-0"></div> */}
        <img src="https://covers.openlibrary.org/b/isbn/0425046877-M.jpg" className="max-h-70 object-contain rounded-md"/>
        <div className="flex flex-col mx-8">

          {book.series && (
            <p className="text-lg text-foreground/80 text-center md:text-left">
              <Link href={`/series/${book.series.id}`} className="hover:underline">
                {book.series.name}
              </Link>
              {book.series_index && ` #${book.series_index}`}
            </p>
          )}


          <h1 className="text-3xl font-bold mb-1 text-center md:text-left">{book.title}</h1>
          <p className="text-lg text-foreground/80 mb-5 text-center md:text-left">
            by <span className="font-medium">{book.author}</span>
          </p>
          <p className="text-lg text-foreground/80 mb-5 text-center md:text-left">
            first published: {book.publication_year}
          </p>

          {book.description && (
            <p className="whitespace-pre-line text-muted-foreground leading-relaxed">{book.description}</p>
          )}
        </div>
      </div>

      <div className="border-t" />
      
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
