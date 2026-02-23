"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import BookCover from "@/components/BookCover";
import BookshelfButton from "@/components/BookshelfButton";
import TagPreferenceIcons from "@/components/TagPreferenceIcons";
import type { Book } from "@/types";
import { formatAuthors } from "@/lib/authors";
import { BooksTable, BooksColumn } from "@/components/BooksTable";

type BookWithScore = Book & {
  tagScore: number;
  userTagged: boolean;
};

type TagInfo = {
  id: string;
  name: string;
  description: string | null;
  category_name: string;
};

export default function TagPage({ params }: { params: Promise<{ tag_id: string }> }) {
  const [tagId, setTagId] = useState<string | null>(null);
  const [tag, setTag] = useState<TagInfo | null>(null);
  const [books, setBooks] = useState<BookWithScore[]>([]);
  const [onlyMine, setOnlyMine] = useState(false);
  const [sort, setSort] = useState("score");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Unwrap params
  useEffect(() => {
    params.then((p) => setTagId(p.tag_id));
  }, [params]);

  // Fetch tag info
  useEffect(() => {
    if (!tagId) return;
    fetch(`/api/tags/${tagId}/info`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data) setTag(data); })
      .catch(console.error);
  }, [tagId]);

  // Fetch books
  const fetchBooks = useCallback(async () => {
    if (!tagId) return;
    setIsLoading(true);
    const p = new URLSearchParams({
      sort,
      dir,
      ...(onlyMine && user ? { mine: "true" } : {}),
    });
    try {
      const res = await fetch(`/api/tags/${tagId}/books?${p.toString()}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setBooks(data.books || []);
    } catch (err) {
      console.error(err);
      setBooks([]);
    } finally {
      setIsLoading(false);
    }
  }, [tagId, sort, dir, onlyMine, user]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  function handleSortToggle(col: string) {
    if (sort === col) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSort(col);
      setDir("desc");
    }
  }

  if (!tag) {
    return (
      <div className="mx-auto max-w-5xl p-4">
        <p className="text-muted-foreground">{isLoading ? "Loading..." : "Tag not found"}</p>
      </div>
    );
  }

  //------------------------------------------------ Columns ------------------------------------------------
  const columns: BooksColumn<BookWithScore>[] = [
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
      <div className="block">
        <Link
          href={`/books/${book.id}`}
          className="text-lg sm:text-sm font-medium text-foreground hover:underline truncate inline sm:block text-wrap mr-1 sm:mr-0"
        >
          {book.title}
        </Link>
        {book.series && <Link
            href={`/series/${book.series.id}`}
            className="text-lg sm:text-sm text-muted-foreground/80 hover:underline truncate inline sm:block text-wrap"
          >
            ({book.series.name} #{book.series_index})
          </Link>}
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
    mobile: "main",
    render: (book) => (
      <span className="text-muted-foreground">
        {book.publication_year || "-"}
      </span>
    ),
  },
  {
    id: "score",
    header: "Score",
    width: "w-[80px]",
    sortable: true,
    mobile: "main",
    render: (book) => (
      <>
      <span className="sm:hidden text-muted-foreground">score: </span>
      <span className="text-muted-foreground">{book.tagScore}</span>
      </>
    ),
  },
  {
    id: "actions",
    header: "",
    width: "w-[180px]",
    mobile: "bottom",
    render: (book) => (
      <div className="flex justify-center sm:justify-end">
        <BookshelfButton bookId={book.id} />
      </div>
    ),
  },
];


  return (
    <div className="mx-auto max-w-5xl p-2 md:p-8 space-y-6 mb-10">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{tag.category_name}</p>
          <h1 className="text-3xl font-bold">{tag.name}</h1>
          {tag.description && (
            <p className="text-muted-foreground mt-1 leading-relaxed">{tag.description}</p>
          )}
        </div>
        <TagPreferenceIcons tagId={tag.id} />
      </div>

      <div className="border-t" />

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">
          Books ({books.length})
        </h2>
        {user && (
          <label className="flex items-center gap-2 text-md cursor-pointer">
            <input
              type="checkbox"
              checked={onlyMine}
              onChange={(e) => setOnlyMine(e.target.checked)}
              className="rounded border-border accent-primary w-4 h-4 bg-background"
            />
            Show only my books
          </label>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-muted-foreground">Loading books...</p>
      ) : books.length === 0 ? (
        <p className="text-muted-foreground">No books found with this tag.</p>
      ) : (
        <BooksTable
          data={books}
          columns={columns}
          sort={sort}
          dir={dir}
          onSort={handleSortToggle}
        />
      )}

    </div>
  );
}
