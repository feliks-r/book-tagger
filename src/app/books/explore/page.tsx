"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import TagFilterInput from "@/components/TagFilterInput";
import BookCover from "@/components/BookCover";
import type { Book } from "@/types";

type SelectedTag = {
  id: string;
  name: string;
};

type BookResult = Book & {
  matchScore: number;
  popularity: number;
};

export default function ExplorePage() {
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [includeTags, setIncludeTags] = useState<SelectedTag[]>([]);
  const [excludeTags, setExcludeTags] = useState<SelectedTag[]>([]);
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [sortBy, setSortBy] = useState<"best_match" | "popularity">("best_match");
  const [books, setBooks] = useState<BookResult[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchBooks = useCallback(async (sort: "best_match" | "popularity") => {
    setIsLoading(true);
    setHasSearched(true);

    const params = new URLSearchParams();

    if (includeTags.length > 0) {
      params.set("include", includeTags.map((t) => t.id).join(","));
    }
    if (excludeTags.length > 0) {
      params.set("exclude", excludeTags.map((t) => t.id).join(","));
    }
    if (yearFrom) {
      params.set("yearFrom", yearFrom);
    }
    if (yearTo) {
      params.set("yearTo", yearTo);
    }
    params.set("sort", sort);

    try {
      const res = await fetch(`/api/books/explore?${params.toString()}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setBooks(data.books || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Explore search error:", err);
      setBooks([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [includeTags, excludeTags, yearFrom, yearTo]);

  function handleApplyFilters() {
    fetchBooks(sortBy);
  }

  function handleSortChange(newSort: "best_match" | "popularity") {
    setSortBy(newSort);
    if (hasSearched) {
      fetchBooks(newSort);
    }
  }

  function handleAddIncludeTag(tag: SelectedTag) {
    // Ensure tag isn't already in exclude
    setExcludeTags((prev) => prev.filter((t) => t.id !== tag.id));
    setIncludeTags((prev) => [...prev, tag]);
  }

  function handleAddExcludeTag(tag: SelectedTag) {
    // Ensure tag isn't already in include
    setIncludeTags((prev) => prev.filter((t) => t.id !== tag.id));
    setExcludeTags((prev) => [...prev, tag]);
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-foreground mb-6">Explore Books</h1>

      {/* Collapsible Filters */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen} className="mb-8">
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between mb-2">
            <span>{filtersOpen ? "Hide Filters" : "Show Filters"}</span>
            {filtersOpen ? (
              <ChevronUp className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border rounded-lg p-4 space-y-6 bg-card">
            {/* Tags Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Tags</h3>

              <TagFilterInput
                label="Include"
                selectedTags={includeTags}
                onAdd={handleAddIncludeTag}
                onRemove={(id) => setIncludeTags((prev) => prev.filter((t) => t.id !== id))}
                placeholder="Search tags to include..."
              />

              <TagFilterInput
                label="Exclude"
                selectedTags={excludeTags}
                onAdd={handleAddExcludeTag}
                onRemove={(id) => setExcludeTags((prev) => prev.filter((t) => t.id !== id))}
                placeholder="Search tags to exclude..."
              />
            </div>

            {/* Publication Year Range */}
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

            {/* Apply Button */}
            <Button onClick={handleApplyFilters} disabled={isLoading} className="w-full">
              {isLoading ? "Searching..." : "Apply Filters"}
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Sort Options */}
      {hasSearched && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-muted-foreground">
            {total} {total === 1 ? "book" : "books"} found
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as "best_match" | "popularity")}
              className="border rounded px-2 py-1 text-sm bg-background text-foreground"
            >
              <option value="best_match">Best Match</option>
              <option value="popularity">Popularity</option>
            </select>
          </div>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Searching...</div>
      ) : hasSearched && books.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No books match your filters. Try adjusting your criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {books.map((book) => (
            <Link
              key={book.id}
              href={`/books/${book.id}`}
              className="flex gap-4 border rounded-lg p-4 hover:bg-secondary/50 transition-colors"
            >
              <BookCover
                coverId={book.cover_id}
                title={book.title}
                author={book.author}
                size="M"
              />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-foreground">{book.title}</h2>
                <p className="text-muted-foreground">{book.author}</p>
                {book.publication_year && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Published: {book.publication_year}
                  </p>
                )}
                {book.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {book.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Initial state */}
      {!hasSearched && (
        <div className="text-center py-12 text-muted-foreground">
          Use the filters above to discover books by tags, publication year, and more.
        </div>
      )}
    </div>
  );
}
