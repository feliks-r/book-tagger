"use client";

import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tag, TagCategory, BookTagWithVotes } from "@/types";

type Props = { 
  bookId: string;
  onTagAdded: (tag: BookTagWithVotes) => void;
};

export default function AddTagInput({ bookId, onTagAdded }: Props) {

  //tag search
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  //hiding and showing tag search suggestions
  const searchRef = useRef<HTMLFormElement | null>(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  //proposing tags
  const [showPropose, setShowPropose] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [newTagDescription, setNewTagDescription] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [categories, setCategories] = useState<TagCategory[]>([]);

  // ----------------- Hide suggestions when clicking off -----------------
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setSuggestionsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ----------------- Debounced search -----------------
  useEffect(() => {
    if (!query.trim()) return setSuggestions([]);
    const timeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/tags/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions(data.tags || []);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  // ----------------- Fetch categories -----------------
  useEffect(() => {
    fetch("/api/tag-categories")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch categories");
        return res.json();
      })
      .then((data) => setCategories(data.categories || []))
      .catch((err) => {
        console.error("Error fetching categories:", err);
        setCategories([]);
      });
  }, []);

  useEffect(() => {
    if (categories.length && !selectedCategoryId) {
      const defaultCat = categories.find((c) => c.name === "themes");
      setSelectedCategoryId(defaultCat?.id || categories[0].id);
    }
  }, [categories]);

  // ----------------- Select existing tag -----------------
  async function handleSelect(tag: Tag) {

    const res = await fetch("/api/tags/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId, tagId: tag.id }),
    });

    if (res.ok) {
      const data = await res.json(); // return full tag row with score & category
      onTagAdded(data.tag);
      setQuery("");
      setSuggestions([]);
    }
  }

  // ----------------- Propose new tag -----------------
  function openProposeModal() {
    setNewTagName(query);
    setNewTagDescription("");
    setShowPropose(true);
  }

  async function handleSubmitNewTag() {
    const error = validateTagName(newTagName);
    if (error) return setNameError(error);

    const res = await fetch("/api/tags/propose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newTagName,
        categoryId: selectedCategoryId,
        description: newTagDescription,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      setNameError(err.error || "Failed to submit tag.");
      return;
    }

    setShowPropose(false);
    setQuery("");
    setSuggestions([]);
    setMessage("Tag proposal submitted for review!");
  }

  function validateTagName(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return "Tag name is required.";
    if (trimmed.length < 2) return "Tag name must be at least 2 characters.";
    if (trimmed.length > 40) return "Tag name must be under 40 characters.";
    if (!/^[a-zA-Z0-9\s-]+$/.test(trimmed)) return "Only letters, numbers, spaces, and hyphens are allowed.";
    return null;
  }

  // ----------------- Render -----------------
  return (
    <div className="relative w-full max-w-md" >
      <form ref={searchRef}>
      <Input 
        value={query} 
        onChange={(e) => {
              setQuery(e.target.value);
              setSuggestionsOpen(true);
            }}
        onFocus={() => setSuggestionsOpen(true)}
        placeholder="Add a tag..." 
      />

      {suggestionsOpen && query.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded border bg-background shadow">
          {isLoading && <div className="px-3 py-2 text-sm text-muted-foreground">Searching...</div>}
          {!isLoading && suggestions.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">No matching tags</div>
          )}
          {!isLoading &&
            suggestions.map((tag) => (
              <div
                key={tag.id}
                className="cursor-pointer px-3 py-2 hover:bg-secondary"
                onClick={() => handleSelect(tag)}
              >
                <div className="inline-block">{tag.name}</div>
                {tag.category && <small className="text-muted-foreground inline-block ml-2">({tag.category.name})</small>}
              </div>
            ))}
          <div className="border-t" />
          <div className="cursor-pointer px-3 py-2 text-sm text-primary hover:bg-secondary" onClick={openProposeModal}>
            Propose new tag: <strong>{query}</strong>
          </div>
        </div>
      )}
      </form>

      {/* Modal */}
      <Dialog open={showPropose} onOpenChange={setShowPropose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Propose a New Tag</DialogTitle>
            <DialogDescription className="sr-only">Provide information about your tag proposal</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block font-medium">Tag Name:</label>
              <Input value={newTagName} onChange={(e) => setNewTagName(e.target.value)} />
              {nameError && <p className="mt-1 text-sm text-red-600">{nameError}</p>}
            </div>

            <div>
              <label>Category:</label>
              <Select value={selectedCategoryId} onValueChange={(v) => setSelectedCategoryId(v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectGroup>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block font-medium">Description (optional):</label>
              <Textarea value={newTagDescription} onChange={(e) => setNewTagDescription(e.target.value)} placeholder="What does this tag mean?" />
            </div>
          </div>
          
          {message && <p className="mt-1 text-sm text-positive">{message}</p>}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setShowPropose(false); setNameError(null); }}>
              Cancel
            </Button>
            <Button onClick={handleSubmitNewTag}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
