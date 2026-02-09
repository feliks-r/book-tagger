"use client";

import { useState, useEffect, useCallback } from "react";
import { Bookmark, Bell, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type Preference = "saved" | "followed" | "hidden";

const icons: { pref: Preference; Icon: typeof Bookmark; label: string }[] = [
  { pref: "saved", Icon: Bookmark, label: "Save" },
  { pref: "followed", Icon: Bell, label: "Follow" },
  { pref: "hidden", Icon: EyeOff, label: "Hide" },
];

export default function TagPreferenceIcons({ tagId }: { tagId: string }) {
  const { user } = useAuth();
  const [active, setActive] = useState<Set<Preference>>(new Set());
  const [loading, setLoading] = useState<Preference | null>(null);

  const fetchPrefs = useCallback(async () => {
    const res = await fetch(`/api/tags/${tagId}/preferences`);
    if (!res.ok) return;
    const data = await res.json();
    setActive(new Set(data.preferences));
  }, [tagId]);

  useEffect(() => {
    if (user) fetchPrefs();
  }, [user, fetchPrefs]);

  async function toggle(pref: Preference) {
    if (!user || loading) return;

    const previous = new Set(active);
    // Optimistic update
    const next = new Set(active);
    if (next.has(pref)) {
      next.delete(pref);
    } else {
      next.add(pref);
    }
    setActive(next);
    setLoading(pref);

    try {
      const res = await fetch(`/api/tags/${tagId}/preferences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preference: pref }),
      });
      if (!res.ok) throw new Error("Failed");
    } catch {
      // Rollback
      setActive(previous);
    } finally {
      setLoading(null);
    }
  }

  if (!user) return null;

  return (
    <div className="flex items-center gap-1">
      {icons.map(({ pref, Icon, label }) => {
        const isActive = active.has(pref);
        return (
          <button
            key={pref}
            type="button"
            onClick={() => toggle(pref)}
            disabled={loading !== null}
            title={isActive ? `Remove ${label.toLowerCase()}` : label}
            className={`p-2 rounded-md transition-colors ${
              isActive
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            } ${loading === pref ? "opacity-50" : ""}`}
            aria-label={label}
          >
            <Icon className="h-5 w-5" fill={isActive ? "currentColor" : "none"} />
          </button>
        );
      })}
    </div>
  );
}
