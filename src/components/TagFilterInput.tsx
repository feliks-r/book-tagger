"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

type TagSuggestion = {
  id: string;
  name: string;
  category?: { name: string } | null;
};

type SelectedTag = {
  id: string;
  name: string;
};

type TagFilterInputProps = {
  label: string;
  selectedTags: SelectedTag[];
  onAdd: (tag: SelectedTag) => void;
  onRemove: (tagId: string) => void;
  placeholder?: string;
};

export default function TagFilterInput({
  label,
  selectedTags,
  onAdd,
  onRemove,
  placeholder = "Search tags...",
}: TagFilterInputProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search tags
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/tags/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        // Filter out already selected tags
        const filtered = (data.tags || []).filter(
          (tag: TagSuggestion) => !selectedTags.some((st) => st.id === tag.id)
        );
        setSuggestions(filtered);
      } catch (err) {
        console.error("Tag search error:", err);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selectedTags]);

  function handleSelect(tag: TagSuggestion) {
    onAdd({ id: tag.id, name: tag.name });
    setQuery("");
    setSuggestions([]);
    setShowDropdown(false);
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>

      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-secondary text-secondary-foreground rounded-md"
            >
              {tag.name}
              <button
                type="button"
                onClick={() => onRemove(tag.id)}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative" ref={containerRef}>
        <Input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          className="w-full"
        />

        {/* Dropdown */}
        {showDropdown && (query.length >= 2 || isLoading) && (
          <div className="absolute z-10 mt-1 w-full rounded border bg-background shadow-md max-h-48 overflow-y-auto">
            {isLoading && (
              <div className="px-3 py-2 text-sm text-muted-foreground">Searching...</div>
            )}
            {!isLoading && suggestions.length === 0 && query.length >= 2 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">No matching tags</div>
            )}
            {!isLoading &&
              suggestions.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-secondary cursor-pointer"
                  onClick={() => handleSelect(tag)}
                >
                  <span>{tag.name}</span>
                  {tag.category && (
                    <small className="text-muted-foreground ml-2">({tag.category.name})</small>
                  )}
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
