'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

import { useAuth } from '@/context/AuthContext'
import { UserMenu } from './UserMenu'

import { Search, BookOpen } from "lucide-react";
import { Input } from '@/components/ui/input'
import BookCover from './BookCover';

import type { Book } from "@/types";

import { MobileMenu } from './MobileMenu';
import { NavLinks } from './NavLinks';

import { formatAuthors } from "@/lib/authors";

export default function Navbar() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchRef = useRef<HTMLFormElement | null>(null);

  // ----------------- Hide suggestions when clicking off -----------------
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setSuggestionsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ----------------- Debounced search -----------------
  useEffect(() => {
    if (!query.trim()) return setSuggestions([]);
    const timeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions(data.books || []);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  // ----------------- Enter search -----------------
  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    router.push(`/search?q=${encodeURIComponent(query)}`)
    setQuery('')
  }

  return (
    <header className="sticky top-0 border-b z-50 bg-background">
      <div className="max-w-7xl mx-auto p-0 flex items-center justify-between min-h-12">

        {/*--------------------- Mobile (hamburger menu) ---------------------*/}
        <MobileMenu user={user} profile={profile}/>

        {/*--------------------- Navigation ---------------------*/}
        <nav className='hidden md:flex py-2 items-center lg:gap-10'>
        <Link 
          key="home"
          href="/"
          className={"font-bold text-xl px-5 hidden md:inline-block"}
        >
          <BookOpen className='inline-block' size={30}/>
          <span className='font-heading hidden lg:inline-block ml-2'>CoLibrary</span>
        </Link>

        {/* Navigation Links - Hidden on mobile */}
        
          <NavLinks />
        </nav>

        {/*--------------------- Center: Search ---------------------*/}
        <form ref={searchRef} onSubmit={handleSearch} className="w-80 lg:w-90 relative">

          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-secondary-foreground" />
          <Input
            placeholder="Search books…"
            className="pl-9"
            value={query}
            type='search'
            onFocus={() => setSuggestionsOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setSuggestionsOpen(true);
            }}
          />

          {suggestionsOpen && query.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded border bg-card shadow">
            {isLoading && <div className="px-3 py-2 text-sm text-muted-foreground">Searching...</div>}
            {!isLoading && suggestions.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">No matching results</div>
            )}
            {!isLoading &&
              suggestions.map((book) => (
                <Link
                  key={book.id}
                  className="cursor-pointer w-full px-2 py-1 hover:bg-accent rounded flex gap-2 transition-colors"
                  href={`/books/${book.id}`}
                >
                  <BookCover coverId={book.cover_id} title={book.title} author={formatAuthors(book.authors)} size="S" />
                  <div className='min-w-0'>
                    <div className='text-base truncate'>{book.title}</div>
                    {book.authors && <small className="text-muted-foreground truncate block">{formatAuthors(book.authors)}</small>}
                  </div>
                </Link>
              ))}
          </div>
        )}

        </form>

        {/*--------------------- Right: Auth ---------------------*/}
        <UserMenu user={user} profile={profile}/>

      </div>
    </header>
  )
}
