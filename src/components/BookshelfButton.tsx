"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { BookOpen, ChevronDown, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BookshelfWithStatus } from "@/types";

type Props = {
  bookId: string;
};

export default function BookshelfButton({ bookId }: Props) {
  const { user, loading: authLoading } = useAuth();
  const [shelves, setShelves] = useState<BookshelfWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchShelves = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/bookshelves?bookId=${bookId}`);
      if (!res.ok) throw new Error("Failed to fetch shelves");
      const data = await res.json();
      setShelves(data.shelves || []);
    } catch (err) {
      console.error("Error fetching shelves:", err);
    } finally {
      setLoading(false);
    }
  }, [user, bookId]);

  useEffect(() => {
    if (!authLoading) {
      fetchShelves();
    }
  }, [authLoading, fetchShelves]);

  async function toggleShelf(shelfId: string, currentlyHasBook: boolean) {
    setTogglingId(shelfId);

    // Optimistic update
    setShelves((prev) =>
      prev.map((s) => (s.id === shelfId ? { ...s, hasBook: !s.hasBook } : s))
    );

    try {
      const url = `/api/bookshelves/${shelfId}/books`;
      const res = await fetch(url, {
        method: currentlyHasBook ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });

      if (!res.ok) {
        // Rollback on failure
        setShelves((prev) =>
          prev.map((s) =>
            s.id === shelfId ? { ...s, hasBook: currentlyHasBook } : s
          )
        );
      }
    } catch {
      // Rollback on error
      setShelves((prev) =>
        prev.map((s) =>
          s.id === shelfId ? { ...s, hasBook: currentlyHasBook } : s
        )
      );
    } finally {
      setTogglingId(null);
    }
  }

  async function addToDefaultShelf() {
    if (shelves.length === 0) return;
    const defaultShelf = shelves[0];
    await toggleShelf(defaultShelf.id, false);
  }

  if (authLoading || !user) {
    return null;
  }

  const onAnyShelves = shelves.some((s) => s.hasBook);
  const activeShelfNames = shelves
    .filter((s) => s.hasBook)
    .map((s) => s.name);

  return (
    <div className="flex items-center">
      <Button
        variant={onAnyShelves ? "default" : "outline"}
        className="rounded-r-none border-r-0"
        onClick={() => {
          if (!onAnyShelves) {
            addToDefaultShelf();
          }
        }}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            {onAnyShelves ? (
              <Check className="size-4 mr-1.5" />
            ) : (
              <BookOpen className="size-4 mr-1.5" />
            )}
            <span className="max-w-40 truncate">
              {onAnyShelves ? activeShelfNames.join(", ") : "Add to shelf"}
            </span>
          </>
        )}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={onAnyShelves ? "default" : "outline"}
            className="rounded-l-none px-2"
            disabled={loading}
          >
            <ChevronDown className="size-4" />
            <span className="sr-only">Choose bookshelf</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Your Bookshelves</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {shelves.map((shelf) => (
            <DropdownMenuCheckboxItem
              key={shelf.id}
              checked={shelf.hasBook}
              disabled={togglingId === shelf.id}
              onCheckedChange={() => toggleShelf(shelf.id, shelf.hasBook)}
              onSelect={(e) => e.preventDefault()}
            >
              {shelf.name}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
