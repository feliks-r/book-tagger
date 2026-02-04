'use client'

import { useState, useEffect } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from "@/components/ui/select";
import type { Shelf, Book } from "@/types";
import Link from 'next/link'

export default function MyBooks(){

  const [bookshelves, setBookshelves] = useState<Shelf[]>([]);
  const [selectedShelf, setSelectedShelf] = useState<string>("");
  const [books, setBooks] = useState<Book[]>([]);

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
}, [selectedShelf])


  function openShelfEditing() {
    setShowEditing(true);
  }
  console.log(books)

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
      <div>
        {books?.map((book) => (
          <p key={book.id}>{book.title}</p>
        )) }
      </div>
    </div>
  )
}