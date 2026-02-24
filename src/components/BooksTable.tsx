"use client";

import { ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";

export type BooksColumn<T> = {
  id: string;
  header: string;
  width?: string; // tailwind width like w-[80px]
  sortable?: boolean;
  mobile?: "cover" | "main" | "bottom";
  render: (row: T) => React.ReactNode;
};

type Props<T> = {
  data: T[];
  columns: BooksColumn<T>[];
  sort?: string;
  dir?: "asc" | "desc";
  onSort?: (column: string) => void;
};

export function BooksTable<T>({
  data,
  columns,
  sort,
  dir,
  onSort,
}: Props<T>) {

  const coverCol = columns.find((c) => c.mobile === "cover");
  const bottomCols = columns.filter((c) => c.mobile === "bottom");
  const mainCols = columns.filter(
    (c) => !c.mobile || c.mobile === "main"
  );

  function SortIndicator({ column }: { column: string }) {
    if (sort !== column) return <ArrowUpDown className="size-3.5 opacity-40" />;
    return dir === "asc" ? (
      <ChevronUp className="size-3.5" />
    ) : (
      <ChevronDown className="size-3.5" />
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        {/* HEADER */}
        <thead className="font-heading hidden sm:table-header-group bg-card text-secondary-foreground border-b">
          <tr>
            {columns.map((col) => (
              <th
                key={col.id}
                className={`px-2 py-2 lg:px-4 font-medium text-left ${col.width ?? ""}`}
              >
                {col.sortable && onSort ? (
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-foreground"
                    onClick={() => onSort(col.id)}
                  >
                    {col.header}
                    <SortIndicator column={col.id} />
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>

        {/* BODY */}
        <tbody>
          {data.map((row: any, i) => (
            <tr
              key={row.id ?? i}
              className="border-b last:border-0 block sm:table-row p-4 lg:p-4"
            >
              {/* MOBILE LAYOUT */}
              <td className="sm:hidden block">
                <div className="flex gap-3">
                  {/* LEFT: COVER */}
                  {coverCol && (
                    <div className="shrink-0">
                      {coverCol.render(row)}
                    </div>
                  )}

                  {/* RIGHT: MAIN INFO */}
                  <div className="flex-1 min-w-0 space-y-1">
                    {mainCols
                      .filter((c) => c !== coverCol)
                      .map((col) => (
                        <div key={col.id}>{col.render(row)}</div>
                      ))}
                  </div>
                </div>

                {/* BOTTOM */}
                {bottomCols.length > 0 && (
                  <div className="mt-3 flex justify-center gap-2">
                    {bottomCols.map((col) => (
                      <div key={col.id}>{col.render(row)}</div>
                    ))}
                  </div>
                )}
              </td>

              {columns.map((col) => (
                <td
                  key={col.id}
                  data-label={col.header}
                  className="py-1 px-2 lg:px-4 sm:py-3 hidden sm:table-cell"
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* MOBILE STACK */}
      <style jsx>{`
        @media (max-width: 640px) {
          td[data-label] {
            display: flex;
            justify-content: space-between;
            gap: 1rem;
          }
          td[data-label]::before {
            content: attr(data-label);
            font-weight: 500;
            color: hsl(var(--muted-foreground));
          }
        }
      `}</style>
    </div>
  );
}
