import { createClient } from "@/lib/supabase/server";
import TagSection from "@/components/TagSection";
import type { Book, BookTagWithVotes, GroupedCategory } from "@/types";

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
    .select("id, title, author, description")
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

  // ------------------------------------------------------------
  // Group by category
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
        <div className="bg-muted w-45 min-w-45 h-60 rounded-sm m-auto mt-0 mb-4 md:m-0"></div>
        <div className="flex flex-col mx-8">
          <h1 className="text-3xl font-bold mb-1 text-center md:text-left">{book.title}</h1>
          <p className="text-lg text-foreground/80 mb-5 text-center md:text-left">
            by <span className="font-medium">{book.author}</span>
          </p>

          {book.description && (
            <p className="text-foreground leading-relaxed">{book.description}</p>
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
