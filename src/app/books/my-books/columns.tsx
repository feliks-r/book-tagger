"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { Book } from "@/types";
import { Button } from "@/components/ui/button";

import { ArrowUpDown } from "lucide-react"

export type BookRow = {
  id: string
  cover: string
  title: string
  author: string
}

export const columns: ColumnDef<Book>[] = [
  {
    accessorKey: "olid",
    header: "cover",
    cell: ({ row }) => {
      return (
        <img src="https://covers.openlibrary.org/b/isbn/0425046877-S.jpg" className="max-h-70 object-contain rounded-md"/>
      )
    },
  },
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "author",
    header: "Author",
  },
]