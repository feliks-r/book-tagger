"use client";

import { useState, useEffect, useCallback } from "react";
import { Bookmark, Bell, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { TagPreferences } from "@/types";

type PreferenceField = keyof TagPreferences;

const icons: { field: PreferenceField; Icon: typeof Bookmark; label: string }[] = [
  { field: "is_saved", Icon: Bookmark, label: "Save" },
  { field: "is_followed", Icon: Bell, label: "Follow" },
  { field: "is_hidden", Icon: EyeOff, label: "Hide" },
];

export default function TagPreferenceIcons({ tagId }: { tagId: string }) {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<TagPreferences>({
    is_saved: false,
    is_followed: false,
    is_hidden: false,
  });
  const [loading, setLoading] = useState<PreferenceField | null>(null);

  const fetchPrefs = useCallback(async () => {
    const res = await fetch(`/api/tags/${tagId}/preferences`);
    if (!res.ok) return;
    const data: TagPreferences = await res.json();
    setPrefs(data);
  }, [tagId]);

  useEffect(() => {
    if (user) fetchPrefs();
  }, [user, fetchPrefs]);

  async function toggle(field: PreferenceField) {
    if (!user || loading) return;

    const previous = { ...prefs };
    // Optimistic update
    setPrefs((prev) => ({ ...prev, [field]: !prev[field] }));
    setLoading(field);

    try {
      const res = await fetch(`/api/tags/${tagId}/preferences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field }),
      });
      if (!res.ok) throw new Error("Failed");
    } catch {
      // Rollback
      setPrefs(previous);
    } finally {
      setLoading(null);
    }
  }

  if (!user) return null;

  return (
    <div className="flex items-center gap-1">
      {icons.map(({ field, Icon, label }) => {
        const isActive = prefs[field];
        return (
          <button
            key={field}
            type="button"
            onClick={() => toggle(field)}
            disabled={loading !== null}
            title={isActive ? `Remove ${label.toLowerCase()}` : label}
            className={`p-2 rounded-md transition-colors ${
              isActive
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            } ${loading === field ? "opacity-50" : ""}`}
            aria-label={label}
          >
            <Icon className="h-5 w-5" fill={isActive ? "currentColor" : "none"} />
          </button>
        );
      })}
    </div>
  );
}
