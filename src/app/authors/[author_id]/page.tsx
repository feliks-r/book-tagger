"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import BookCover from "@/components/BookCover";
import BookshelfButton from "@/components/BookshelfButton";
import { formatAuthors } from "@/lib/authors";
import type { Book, Author } from "@/types";
import { BooksTable, BooksColumn } from "@/components/BooksTable";

type TagWithCount = {
  id: string;
  name: string;
  description: string | null;
  category_name: string;
  count: number;
};

export default function AuthorPage() {
  const { author_id } = useParams<{ author_id: string }>();
  const [author, setAuthor] = useState<Author | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [tab, setTab] = useState<"books" | "tags">("books");
  const [loading, setLoading] = useState(true);

  // Sorting for books
  const [sortBy, setSortBy] = useState("publication_year");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/authors/${author_id}?tab=${tab}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAuthor(data.author);
      if (tab === "books") {
        setBooks(data.books || []);
      } else {
        setTags(data.tags || []);
      }
    } catch (err) {
      console.error("Error fetching author data:", err);
    } finally {
      setLoading(false);
    }
  }, [author_id, tab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleSortToggle(column: string) {
    if (sortBy === column) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDir(column === "title" ? "asc" : "asc");
    }
  }

  const sortedBooks = [...books].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortBy === "title") {
      return dir * a.title.localeCompare(b.title);
    }
    return dir * ((a.publication_year ?? 9999) - (b.publication_year ?? 9999));
  });

  //------------------------------------------------ Columns ------------------------------------------------
  const columns: BooksColumn<Book>[] = [
    {
      id: "cover",
      header: "Cover",
      width: "w-[46px]",
      mobile: "cover",
      render: (book) => (
        <>
        <BookCover
          coverId={book.cover_id}
          title={book.title}
          author={formatAuthors(book.authors)}
          className="hidden sm:flex"
          size="S"
        />
        <BookCover
          coverId={book.cover_id}
          title={book.title}
          author={formatAuthors(book.authors)}
          className="flex sm:hidden"
          size="M"
        />
        </>
      ),
    },
    {
      id: "title",
      header: "Title",
      sortable: true,
      mobile: "main",
      render: (book) => (
        <div className="flex flex-col font-heading">
          <span>
            <Link
              href={`/books/${book.id}`}
              className="text-lg/6 sm:text-sm font-medium text-foreground hover:underline truncate inline text-wrap mr-1 sm:mr-0"
            >
              {book.title}
            </Link>
          </span>

          {book.series && 
          <span>
            <Link
              href={`/series/${book.series.id}`}
              className="text-lg/6 sm:text-sm text-muted-foreground/90 hover:underline truncate inline text-wrap"
            >
              ({book.series.name} #{book.series_index})
            </Link>
          </span>}
        </div>
      ),
    },
    {
      id: "author",
      header: "Author(s)",
      mobile: "main",
      render: (book) => (
        <>
        <span className="text-muted-foreground sm:hidden">by </span>
        {book.authors.map((a, i) => (
                    <span key={a.id}>
                      {i > 0 && ", "}
                      <Link href={`/authors/${a.id}`} className="text-muted-foreground hover:underline font-medium sm:font-normal">{a.name}</Link>
                    </span>
                  ))}
        </>
      ),
    },
    {
      id: "publication_year",
      header: "Year",
      width: "w-[64px]",
      sortable: true,
      render: (book) => (
        <span className="text-muted-foreground">
          {book.publication_year || "-"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      //width: "w-[180px]",
      mobile: "bottom",
      render: (book) => (
        <div className="flex justify-center sm:justify-end">
          <BookshelfButton bookId={book.id} />
        </div>
      ),
    },
  ];

  //------------------------------------------------ Render ------------------------------------------------
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Author name */}
      <h1 className="text-3xl font-bold text-foreground mb-1">
        {author?.name ?? "Loading..."}
      </h1>
      {tab === "books" && !loading && (
        <p className="text-sm text-muted-foreground mb-6">
          {books.length} {books.length === 1 ? "book" : "books"}
        </p>
      )}
      {tab === "tags" && !loading && (
        <p className="text-sm text-muted-foreground mb-6">
          {tags.length} {tags.length === 1 ? "tag" : "tags"}
        </p>
      )}

      {/* Tabs */}
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "books" | "tags")}
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="books">Books</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>

        {/* Books tab */}
        <TabsContent value="books">
          {loading ? (
            <p className="text-muted-foreground">Loading books...</p>
          ) : books.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No books found for this author.
            </div>
          ) : (
            <BooksTable
              data={sortedBooks}
              columns={columns}
              sort={sortBy}
              dir={sortDir}
              onSort={handleSortToggle}
            />
          )}
        </TabsContent>

        {/* Tags tab */}
        <TabsContent value="tags">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading tags...</div>
          ) : tags.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No tags found for this author{"'"}s books.
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              {/* Table header */}
              <div className="hidden sm:grid sm:grid-cols-[2fr_1fr_80px] gap-4 items-center px-4 py-2 bg-muted/50 text-sm font-medium text-muted-foreground border-b">
                <span>Tag</span>
                <span>Category</span>
                <span className="text-right">Score</span>
              </div>

              {/* Tag rows */}
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex flex-col gap-1 px-4 py-3 border-b last:border-b-0 sm:grid sm:grid-cols-[2fr_1fr_80px] sm:items-center sm:gap-4"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/tags/${tag.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {tag.name}
                    </Link>
                    {tag.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {tag.description}
                      </p>
                    )}
                  </div>

                  <span className="text-sm text-muted-foreground">
                    {tag.category_name}
                  </span>

                  <span className="text-sm text-muted-foreground sm:text-right tabular-nums">
                    {tag.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
