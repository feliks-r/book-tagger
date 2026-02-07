"use client";

import { useState, useRef, useEffect } from "react";

export default function ExpandableText({
  text,
  maxLines = 6,
}: {
  text: string;
  maxLines?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [needsClamp, setNeedsClamp] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    // Check if the content overflows the clamped height
    setNeedsClamp(el.scrollHeight > el.clientHeight);
  }, [text]);

  return (
    <div className="relative">
      <div
        ref={contentRef}
        className="text-foreground leading-relaxed overflow-hidden transition-[max-height] duration-300 ease-in-out"
        style={{
          maxHeight: expanded ? "none" : `${maxLines * 1.625}rem`,
        }}
      >
        {text}
      </div>

      {/* Gradient fade overlay */}
      {needsClamp && !expanded && (
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      )}

      {needsClamp && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="text-sm text-primary hover:underline mt-1"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
