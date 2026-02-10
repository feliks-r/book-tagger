"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Bookmark, Bell, EyeOff, ThumbsUp, ThumbsDown } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";

type TagItem = {
  id: string;
  name: string;
  description: string | null;
  category_name: string;
  book_count?: number;
  added_at?: string;
};

const tabs = [
  { value: "upvoted", label: "Upvoted", Icon: ThumbsUp },
  { value: "downvoted", label: "Downvoted", Icon: ThumbsDown },
  { value: "saved", label: "Saved", Icon: Bookmark },
  { value: "followed", label: "Followed", Icon: Bell },
  { value: "hidden", label: "Hidden", Icon: EyeOff },
] as const;

export default function MyTagsPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("upvoted");
  const [tags, setTags] = useState<TagItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTags = useCallback(async (tab: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tags/my-tags?tab=${tab}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setTags(data.tags || []);
    } catch (err) {
      console.error(err);
      setTags([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchTags(activeTab);
  }, [user, activeTab, fetchTags]);

  function handleTabChange(value: string) {
    setActiveTab(value);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  if (authLoading) {
    return (
      <div className="mx-auto max-w-4xl p-4">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl p-4">
        <p className="text-muted-foreground">
          Please{" "}
          <Link href="/login" className="text-primary hover:underline">
            log in
          </Link>{" "}
          to view your tags.
        </p>
      </div>
    );
  }

  const isVoteTab = activeTab === "upvoted" || activeTab === "downvoted";

  return (
    <div className="mx-auto max-w-4xl p-2 md:p-8 space-y-6 mb-20">
      <h1 className="text-3xl font-bold">My Tags</h1>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="flex flex-wrap gap-1">
          {tabs.map(({ value, label, Icon }) => (
            <TabsTrigger key={value} value={value} className="flex items-center gap-1.5">
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(({ value }) => (
          <TabsContent key={value} value={value}>
            {isLoading ? (
              <p className="text-muted-foreground py-4">Loading tags...</p>
            ) : tags.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">
                  {value === "upvoted" && "You haven't upvoted any tags yet."}
                  {value === "downvoted" && "You haven't downvoted any tags yet."}
                  {value === "saved" && "You haven't saved any tags yet."}
                  {value === "followed" && "You aren't following any tags yet."}
                  {value === "hidden" && "You haven't hidden any tags yet."}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {(value === "upvoted" || value === "downvoted")
                    ? "Vote on tags on book pages to see them here."
                    : "Use the bookmark, bell, or hide icons on tag pages to manage your preferences."
                  }
                </p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                {/* Header */}
                <div className="hidden sm:grid gap-4 items-center px-4 py-2 bg-card text-sm font-medium text-muted-foreground border-b"
                  style={{
                    gridTemplateColumns: isVoteTab
                      ? "2fr 1fr 80px"
                      : "2fr 1fr 120px",
                  }}
                >
                  <span>Tag</span>
                  <span>Category</span>
                  <span>{isVoteTab ? "Books" : "Added"}</span>
                </div>

                {/* Rows */}
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex flex-col gap-1 px-4 py-3 border-b last:border-b-0 sm:grid sm:items-center sm:gap-4"
                    style={{
                      gridTemplateColumns: isVoteTab
                        ? "2fr 1fr 80px"
                        : "2fr 1fr 120px",
                    }}
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

                    <span className="text-sm text-muted-foreground">
                      {isVoteTab
                        ? `${tag.book_count ?? 0} book${(tag.book_count ?? 0) !== 1 ? "s" : ""}`
                        : tag.added_at ? formatDate(tag.added_at) : "-"
                      }
                    </span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
