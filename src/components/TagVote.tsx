"use client";

import { useState } from "react";
import { ArrowBigUp, ArrowBigDown } from "lucide-react";

type Props = {
  bookId: string;
  tagId: string;
  initialScore: number;
  initialValue: -1 | 0 | 1;
  onChangeVote: (tagId: string, newScore: number, newValue: -1 | 0 | 1) => void;
};

export default function TagVote({ bookId, tagId, initialScore, initialValue, onChangeVote }: Props) {
  const [score, setScore] = useState(initialScore);
  const [value, setValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);

  async function vote(voteValue: 1 | -1) {
    if (loading) return;
    const newValue = value === voteValue ? 0 : voteValue;

    // Store previous state for rollback
    const previousScore = score;
    const previousValue = value;

    // Optimistic update
    const delta = newValue - value;
    const optimisticScore = score + delta;
    setScore(optimisticScore);
    setValue(newValue);
    onChangeVote(tagId, optimisticScore, newValue);

    setLoading(true);
    try {
      const res = await fetch("/api/tags/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, tagId, value: newValue }),
      });

      if (!res.ok) throw new Error("Vote failed");
    } catch (err) {
      // Rollback on error
      setScore(previousScore);
      setValue(previousValue);
      onChangeVote(tagId, previousScore, previousValue);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-1 text-sm">
      {/* Upvote */}
      <button
        onClick={() => vote(1)}
        className="text-xl"
        disabled={loading}
        aria-label="Upvote"
      >
        <ArrowBigUp 
          size={18} 
          className={`hover:text-positive-foreground ${value === 1 ? "text-positive-foreground fill-positive-foreground" : "text-foreground/40"}`}
          strokeWidth={2} 
        />
      </button>

      {/* Score */}
      <span className="text-center font-medium">{score}</span>

      {/* Downvote */}
      <button
        onClick={() => vote(-1)}
        className="text-xl"
        disabled={loading}
        aria-label="Downvote"
      >
        <ArrowBigDown 
          size={18}
          className={`hover:text-destructive-foreground ${value === -1 ? "text-destructive-foreground fill-destructive-foreground" : "text-foreground/40"}`}
          strokeWidth={2} 
        />
      </button>
    </div>
  );
}
