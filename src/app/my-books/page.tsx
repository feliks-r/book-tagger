"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Settings,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TagFilterInput from "@/components/TagFilterInput";
import BookshelfButton from "@/components/BookshelfButton";
import EditShelvesModal from "@/components/EditShelvesModal";
import type { Bookshelf, Book } from "@/types";

type SelectedTag = { id: string; name: string };

type ShelfBook = Book & {
  added_at: string | null;
};

export default function MyBooksPage() {
  const { user, loading: authLoading } = useAuth();
  const [shelves, setShelves] = useState<Bookshelf[]>([]);
  const [selectedShelfId, setSelectedShelfId] = useState<string>("");
  const [books, setBooks] = useState<ShelfBook[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingBooks, setIsFetchingBooks] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Search & filters
  const [titleQuery, setTitleQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [includeTags, setIncludeTags] = useState<SelectedTag[]>([]);
  const [excludeTags, setExcludeTags] = useState<SelectedTag[]>([]);
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");

  // Sorting
  const [sortBy, setSortBy] = useState<"added_at" | "title" | "publication_year">("added_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Fetch shelves
  const fetchShelves = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/bookshelves");
      if (!res.ok) throw new Error("Failed to fetch shelves");
      const data = await res.json();
      const fetchedShelves: Bookshelf[] = data.shelves || [];
      setShelves(fetchedShelves);

      // Select default shelf (display_order 0) if none selected
      if (fetchedShelves.length > 0 && !selectedShelfId) {
        const defaultShelf =
          fetchedShelves.find((s) => s.display_order === 0) || fetchedShelves[0];
        setSelectedShelfId(defaultShelf.id);
      }
    } catch (err) {
      console.error("Error fetching shelves:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedShelfId]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchShelves();
    } else if (!authLoading && !user) {
      setIsLoading(false);
    }
  }, [authLoading, user, fetchShelves]);

  // Fetch books for the selected shelf
  const fetchBooks = useCallback(async () => {
    if (!selectedShelfId) return;
    setIsFetchingBooks(true);

    const params = new URLSearchParams();
    if (titleQuery.trim()) params.set("q", titleQuery.trim());
    if (includeTags.length > 0) params.set("include", includeTags.map((t) => t.id).join(","));
    if (excludeTags.length > 0) params.set("exclude", excludeTags.map((t) => t.id).join(","));
    if (yearFrom) params.set("yearFrom", yearFrom);
    if (yearTo) params.set("yearTo", yearTo);
    params.set("sort", sortBy);
    params.set("dir", sortDir);

    try {
      const res = await fetch(
        `/api/bookshelves/${selectedShelfId}/books/list?${params.toString()}`
      );
      if (!res.ok) throw new Error("Failed to fetch books");
      const data = await res.json();
      setBooks(data.books || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Error fetching shelf books:", err);
      setBooks([]);
      setTotal(0);
    } finally {
      setIsFetchingBooks(false);
    }
  }, [selectedShelfId, titleQuery, includeTags, excludeTags, yearFrom, yearTo, sortBy, sortDir]);

  // Re-fetch when shelf or sort changes
  useEffect(() => {
    if (selectedShelfId) {
      fetchBooks();
    }
  }, [selectedShelfId, sortBy, sortDir, fetchBooks]);

  function handleApplyFilters() {
    fetchBooks();
  }

  function handleSortToggle(column: "added_at" | "title" | "publication_year") {
    if (sortBy === column) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDir(column === "title" ? "asc" : "desc");
    }
  }

  function handleShelvesEdited(updatedShelves: Bookshelf[]) {
    setShelves(updatedShelves);
    // If the selected shelf was deleted, switch to the first available
    if (!updatedShelves.find((s) => s.id === selectedShelfId)) {
      const defaultShelf =
        updatedShelves.find((s) => s.display_order === 0) || updatedShelves[0];
      if (defaultShelf) {
        setSelectedShelfId(defaultShelf.id);
      }
    }
  }

  function handleAddIncludeTag(tag: SelectedTag) {
    setExcludeTags((prev) => prev.filter((t) => t.id !== tag.id));
    setIncludeTags((prev) => [...prev, tag]);
  }

  function handleAddExcludeTag(tag: SelectedTag) {
    setIncludeTags((prev) => prev.filter((t) => t.id !== tag.id));
    setExcludeTags((prev) => [...prev, tag]);
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Not logged in
  if (!authLoading && !user) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">My Books</h1>
        <p className="text-muted-foreground mb-6">
          Please log in to view your bookshelves.
        </p>
        <Link href="/login">
          <Button>Log In</Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl text-center text-muted-foreground">
        Loading your bookshelves...
      </div>
    );
  }

  const selectedShelf = shelves.find((s) => s.id === selectedShelfId);

  function SortIndicator({ column }: { column: string }) {
    if (sortBy !== column) return <ArrowUpDown className="size-3.5 text-muted-foreground" />;
    return sortDir === "asc" ? (
      <ChevronUp className="size-3.5" />
    ) : (
      <ChevronDown className="size-3.5" />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header with shelf selector */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-foreground">My Books</h1>

        <div className="flex items-center gap-2">
          <Select value={selectedShelfId} onValueChange={setSelectedShelfId}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Select a shelf" />
            </SelectTrigger>
            <SelectContent>
              {shelves.map((shelf) => (
                <SelectItem key={shelf.id} value={shelf.id}>
                  {shelf.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setEditModalOpen(true)}
            title="Edit bookshelves"
          >
            <Settings className="size-4" />
            <span className="sr-only">Edit bookshelves</span>
          </Button>
        </div>
      </div>

      {/* Title search */}
      <div className="mb-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchBooks();
          }}
          className="flex items-center gap-2"
        >
          <Input
            type="text"
            value={titleQuery}
            onChange={(e) => setTitleQuery(e.target.value)}
            placeholder="Search by title..."
            className="flex-1"
          />
          <Button type="submit" variant="outline" disabled={isFetchingBooks}>
            Search
          </Button>
        </form>
      </div>

      {/* Collapsible tag/year filters */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen} className="mb-6">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="mb-2 gap-1.5">
            <span>{filtersOpen ? "Hide Filters" : "Show Filters"}</span>
            {filtersOpen ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border rounded-lg p-4 space-y-6 bg-card">
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Tags</h3>
              <TagFilterInput
                label="Include"
                selectedTags={includeTags}
                onAdd={handleAddIncludeTag}
                onRemove={(id) =>
                  setIncludeTags((prev) => prev.filter((t) => t.id !== id))
                }
                placeholder="Search tags to include..."
              />
              <TagFilterInput
                label="Exclude"
                selectedTags={excludeTags}
                onAdd={handleAddExcludeTag}
                onRemove={(id) =>
                  setExcludeTags((prev) => prev.filter((t) => t.id !== id))
                }
                placeholder="Search tags to exclude..."
              />
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Publication Year</h3>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  placeholder="From"
                  value={yearFrom}
                  onChange={(e) => setYearFrom(e.target.value)}
                  className="w-28"
                  min={1000}
                  max={new Date().getFullYear()}
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="number"
                  placeholder="To"
                  value={yearTo}
                  onChange={(e) => setYearTo(e.target.value)}
                  className="w-28"
                  min={1000}
                  max={new Date().getFullYear()}
                />
              </div>
            </div>

            <Button onClick={handleApplyFilters} disabled={isFetchingBooks} className="w-full">
              {isFetchingBooks ? "Searching..." : "Apply Filters"}
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Results info */}
      <div className="mb-2 text-sm text-muted-foreground">
        {selectedShelf && (
          <span>
            {total} {total === 1 ? "book" : "books"} on{" "}
            <strong className="text-foreground">{selectedShelf.name}</strong>
          </span>
        )}
      </div>

      {/* Book table */}
      {isFetchingBooks ? (
        <div className="text-center py-12 text-muted-foreground">Loading books...</div>
      ) : books.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {total === 0 && !titleQuery && includeTags.length === 0 && excludeTags.length === 0
            ? "This shelf is empty. Add books from their pages!"
            : "No books match your search or filters."}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid sm:grid-cols-[2fr_2fr_80px_110px_100px] gap-4 items-center px-4 py-2 bg-muted/50 text-sm font-medium text-muted-foreground border-b">
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
              onClick={() => handleSortToggle("added_at")}
            >
              Added
              <SortIndicator column="added_at" />
            </button>
            <span className="sr-only">Actions</span>
          </div>

          {/* Table rows */}
          {books.map((book) => (
            <div
              key={book.id}
              className="flex flex-col gap-2 px-4 py-3 border-b last:border-b-0 sm:grid sm:grid-cols-[2fr_2fr_80px_110px_100px] sm:items-center sm:gap-4"
            >
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
                {formatDate(book.added_at)}
              </span>

              <div className="flex justify-end">
                <BookshelfButton bookId={book.id} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Shelves Modal */}
      <EditShelvesModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        shelves={shelves}
        onSave={handleShelvesEdited}
      />
    </div>
  );
}
