"use client";

import { useMemo, useState } from "react";
import TagVote from "./TagVote";
import AddTagInput from "./AddTagInput";
import type { BookTagWithVotes } from "@/types";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  bookId: string;
  initialTags: BookTagWithVotes[];
};

export default function TagSection({ bookId, initialTags }: Props) {
  const [tags, setTags] = useState(initialTags);
  const [sortBy, setSortBy] = useState<"score" | "name">("score");

  // Sorting
  const sortedTags = useMemo(() => {
    const copy = [...tags];
    if (sortBy === "score") {
      copy.sort((a, b) => b.score - a.score);
    } else {
      copy.sort((a, b) => a.name.localeCompare(b.name));
    }
    return copy;
  }, [tags, sortBy]);

  // Group by category
  const grouped = useMemo(() => {
    const map: Record<string, { name: string; order: number; tags: BookTagWithVotes[] }> = {};
    for (const tag of sortedTags) {
      if (!map[tag.category_id]) {
        map[tag.category_id] = {
          name: tag.category_name,
          order: tag.category_display_order,
          tags: [],
        };
      }
      map[tag.category_id].tags.push(tag);
    }
    return Object.values(map).sort((a, b) => a.order - b.order);
  }, [sortedTags]);

  function handleVote(tagId: string, newScore: number, newValue: -1 | 0 | 1) {
    setTags((prev) =>
      prev.map((t) =>
        t.id === tagId
          ? { ...t, score: newScore, user_value: newValue }
          : t
      )
    );
  }

  function handleAddTag(newTag: BookTagWithVotes) {
    setTags((prev) => {
      const existing = prev.find((t) => t.id === newTag.id);
      if (existing) {
        // Replace the tag with the full new object from API
        return prev.map((t) => (t.id === newTag.id ? newTag : t));
      }
      return [...prev, newTag];
    });
  }

  //to capitalize theme names
  function capitalizeFirstLetter(val: string) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
  }

  return (
    <div>

      {/* Sort Controls */}
      <div className="text-sm mb-6 mt-1 p-0 flex gap-1 text-foreground/80">
        <label className="text-muted-foreground">sort by:</label>
        <Select value={sortBy} onValueChange={(v: "score" | "name") => setSortBy(v)}>
          <SelectTrigger className="min-h-5 h-5 p-0 pl-2 m-0 data-[size=default]:h-4 data-[size=sm]:h-4">
            <SelectValue/>
          </SelectTrigger>
          <SelectContent position="popper" align="start" className="p-0 m-0">
            <SelectGroup>

                <SelectItem key="score" value="score" className="p-0 m-0">
                  score
                </SelectItem>
                <SelectItem key="name" value="name" className="p-0 m-0">
                  name
                </SelectItem>
              
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Render grouped tags */}
      {grouped.map((category) => (
        <section key={category.name} className="mb-6">
          <h3 className="font-medium mb-2">{capitalizeFirstLetter(category.name)}:</h3>
          <div className="flex flex-wrap gap-2">
            {category.tags.map((tag) => (
              <div key={tag.id} className={`flex items-center gap-3 rounded-full px-3 py-1 text-sm bg-muted
                  
                `}
              >
                <span>{tag.name}</span>

                <TagVote
                  bookId={bookId}
                  tagId={tag.id}
                  initialScore={tag.score}
                  initialValue={tag.user_value}
                  onChangeVote={handleVote}
                />
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Add Tag */}
      <div className="mt-7">
        <h2 className="text-lg font-semibold mb-2">Add Tags</h2>
        <AddTagInput bookId={bookId} onTagAdded={handleAddTag} />
      </div>
    </div>
  );
}
