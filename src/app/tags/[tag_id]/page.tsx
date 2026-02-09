"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import BookCover from "@/components/BookCover";
import BookshelfButton from "@/components/BookshelfButton";
import TagPreferenceIcons from "@/components/TagPreferenceIcons";
import type { Book } from "@/types";

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

  function SortIndicator({ column }: { column: string }) {
    if (sort !== column) return <ArrowUpDown className="h-3.5 w-3.5 opacity-30" />;
    return (
      <ArrowUpDown className={`h-3.5 w-3.5 ${dir === "asc" ? "rotate-180" : ""}`} />
    );
  }

  if (!tag) {
    return (
      <div className="mx-auto max-w-4xl p-4">
        <p className="text-muted-foreground">{isLoading ? "Loading..." : "Tag not found"}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-2 md:p-8 space-y-6">
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
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={onlyMine}
              onChange={(e) => setOnlyMine(e.target.checked)}
              className="rounded border-border"
            />
            My tags only
          </label>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-muted-foreground">Loading books...</p>
      ) : books.length === 0 ? (
        <p className="text-muted-foreground">No books found with this tag.</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="hidden sm:grid sm:grid-cols-[40px_2fr_1fr_80px_80px_100px] gap-4 items-center px-4 py-2 bg-muted/50 text-sm font-medium text-muted-foreground border-b">
            <span className="sr-only">Cover</span>
            <button
              type="button"
              className="flex items-center gap-1 hover:text-foreground text-left"
              onClick={() => handleSortToggle("title")}
            >
              Title
              <SortIndicator column="title" />
            </button>
            <span>Author</span>
            <button
              type="button"
              className="flex items-center gap-1 hover:text-foreground text-left"
              onClick={() => handleSortToggle("publication_year")}
            >
              Year
              <SortIndicator column="publication_year" />
            </button>
            <button
              type="button"
              className="flex items-center gap-1 hover:text-foreground text-left"
              onClick={() => handleSortToggle("score")}
            >
              Score
              <SortIndicator column="score" />
            </button>
            <span className="sr-only">Actions</span>
          </div>

          {books.map((book) => (
            <div
              key={book.id}
              className="flex flex-col gap-2 px-4 py-3 border-b last:border-b-0 sm:grid sm:grid-cols-[40px_2fr_1fr_80px_80px_100px] sm:items-center sm:gap-4"
            >
              <BookCover coverId={book.cover_id} title={book.title} author={book.author} size="S" />

              <Link
                href={`/books/${book.id}`}
                className="font-medium text-foreground hover:underline truncate"
              >
                {book.title}
              </Link>

              <Link
                href={`/authors/${encodeURIComponent(book.author)}`}
                className="text-sm text-muted-foreground hover:underline truncate"
              >
                {book.author}
              </Link>

              <span className="text-sm text-muted-foreground">
                {book.publication_year || "-"}
              </span>

              <span className="text-sm text-muted-foreground">
                {book.tagScore}
              </span>

              <div className="flex justify-end">
                <BookshelfButton bookId={book.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
