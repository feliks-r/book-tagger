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

function Placeholder({
  title,
  author,
  sizeClass,
  className,
}: {
  title: string;
  author: string;
  sizeClass: string;
  className?: string;
}) {
  return (
    <div
      className={`${sizeClass} ${className ?? ""} bg-muted rounded-sm flex flex-col items-center justify-center p-1.5 text-center overflow-hidden shrink-0`}
    >
      <span className="text-[0.65rem] leading-tight font-semibold text-muted-foreground line-clamp-3">
        {title}
      </span>
      <span className="text-[0.55rem] leading-tight text-muted-foreground/70 mt-0.5 line-clamp-2">
        {author}
      </span>
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
