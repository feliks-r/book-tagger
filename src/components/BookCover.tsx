"use client";

import { useState } from "react";

type Size = "S" | "M" | "L";

const sizeClasses: Record<Size, string> = {
  S: "w-11 h-16",
  M: "w-[110px] h-[160px]",
  L: "w-[180px] h-[270px] ",
};

const placeholderClasses: Record<Size, string> = {
  S: "p-1.5",
  M: "p-2",
  L: "p-3",
};

const placeholderTextClasses: Record<Size, { title: string; author: string } | null> = {
  S: null,
  M: {
    title: "text-sm leading-tight font-semibold text-muted-foreground line-clamp-3",
    author: "text-xs leading-tight text-muted-foreground/70 mt-0.5 line-clamp-2",
  },
  L: {
    title: "text-lg leading-tight font-semibold text-muted-foreground line-clamp-4",
    author: "text-md leading-tight text-muted-foreground/70 mt-1 line-clamp-2",
  },
};

type BookCoverProps = {
  coverId?: number | null;
  title: string;
  author: string;
  size?: Size;
  className?: string;
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
  const placeholderClass = placeholderClasses[size]
  return (
    <div
      className={`${sizeClass} ${placeholderClass} ${className ?? ""} bg-muted rounded-sm flex flex-col items-center justify-center text-center overflow-hidden shrink-0`}
    >
      <div className="border border-muted-foreground/60 grow flex flex-col items-center justify-center text-center overflow-hidden shrink-0 m-0 w-full p-1">
        {textClasses && (
        <>
          <span className={textClasses.title}>{title}</span>
          <span className={textClasses.author}>{author}</span>
        </>
      )}
      </div>
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

  if (size=="S"){size = "M"}

  return (
    <img
      src={`https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg?default=false`}
      alt={`Cover of ${title}`}
      className={`${sizeClass} ${className ?? ""} rounded-sm object-cover shrink-0`}
      onError={() => setFailed(true)}
    />
  );
}
