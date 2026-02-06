'use client'

import { useState, useEffect } from "react";
import Link from 'next/link';

import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableRow, TableHeader } from "@/components/ui/table";
import { columns, BookRow } from "./columns"
import { DataTable } from "./data-table"

import type { Shelf, Book } from "@/types";


export default function MyBooks(){

  const [bookshelves, setBookshelves] = useState<Shelf[]>([]);
  const [selectedShelf, setSelectedShelf] = useState<string>("");
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [showEditing, setShowEditing] = useState(false);

  useEffect(() => {
    fetch("/api/bookshelves")
      .then((res) => res.json())
      .then((data) => setBookshelves(data.bookshelves));
  }, []);

  useEffect(() => {
    if (bookshelves.length && !selectedShelf) {
      setSelectedShelf(bookshelves[0].id);
    }
  }, [bookshelves]);

  useEffect(() => {
    setIsLoading(true);
    if (!selectedShelf) return
    
    fetch(`/api/bookshelves/${selectedShelf}/books`)
      .then(async (res) => {
        const body = await res.json()

        if (!res.ok) {
          console.error("API error:", body)
          throw new Error(body.error)
        }

        return body
      })
      .then((data) => setBooks(data.books))
      .catch((err) => console.error("Fetch failed:", err.message))
      .finally(() => setIsLoading(false))
  }, [selectedShelf])




  function openShelfEditing() {
    setShowEditing(true);
  }

  return(
    <div className="w-full">
    <h1>My books</h1>
      <div className="flex items-center">
        <label className="mr-1">Bookshelf:</label>
        {bookshelves[0] && 
          <Select value={selectedShelf} onValueChange={(v) => setSelectedShelf(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue defaultValue={bookshelves[0].id}/>
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectGroup>
                {bookshelves?.map((shelf) => (
                  <SelectItem key={shelf.id} value={shelf.id}>
                    {shelf.name}
                  </SelectItem>
                ))}
                  {/* <div className="cursor-pointer px-3 py-2 text-sm text-primary hover:bg-secondary" onClick={openShelfEditing}>
                    Edit bookshelves
                  </div> */}
              </SelectGroup>
            </SelectContent>
          </Select>
        }
        
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : books.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          This bookshelf is empty.
        </div>
      ) : (
        <DataTable columns={columns} data={books} />
      )}
    </div>
  )
}