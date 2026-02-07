"use client";

import { useState } from "react";

type Size = "S" | "M" | "L";

const sizeClasses: Record<Size, string> = {
  S: "w-8 h-12",
  M: "w-[120px] h-[180px]",
  L: "w-[180px] h-[270px]",
};

type BookCoverProps = {
  coverId?: number | null;
  title: string;
  author: string;
  size?: Size;
  className?: string;
};

const placeholderTextClasses: Record<Size, { title: string; author: string } | null> = {
  S: null,
  M: {
    title: "text-[0.6rem] leading-tight font-semibold text-muted-foreground line-clamp-3",
    author: "text-[0.5rem] leading-tight text-muted-foreground/70 mt-0.5 line-clamp-2",
  },
  L: {
    title: "text-sm leading-tight font-semibold text-muted-foreground line-clamp-4",
    author: "text-xs leading-tight text-muted-foreground/70 mt-1 line-clamp-2",
  },
};

function Placeholder({
  title,
  author,
  size,
  sizeClass,
  className,
}: {
  title: string;
  author: string;
  size: Size;
  sizeClass: string;
  className?: string;
}) {
  const textClasses = placeholderTextClasses[size];

  return (
    <div
      className={`${sizeClass} ${className ?? ""} bg-muted rounded-sm flex flex-col items-center justify-center p-1.5 text-center overflow-hidden shrink-0`}
    >
      {textClasses && (
        <>
          <span className={textClasses.title}>{title}</span>
          <span className={textClasses.author}>{author}</span>
        </>
      )}
    </div>
  );
}

export default function BookCover({
  coverId,
  title,
  author,
  size = "M",
  className,
}: BookCoverProps) {
  const [failed, setFailed] = useState(false);
  const sizeClass = sizeClasses[size];

  if (!coverId || failed) {
    return (
      <Placeholder
        title={title}
        author={author}
        size={size}
        sizeClass={sizeClass}
        className={className}
      />
    );
  }

  return (
    <img
      src={`https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg?default=false`}
      alt={`Cover of ${title}`}
      className={`${sizeClass} ${className ?? ""} rounded-sm object-cover shrink-0`}
      onError={() => setFailed(true)}
    />
  );
}
