'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

import { useAuth } from '@/context/AuthContext'
import AccountMenu from './AccountMenu'

import { Menu } from 'lucide-react'
import { Search } from "lucide-react";
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from '@/components/ui/navigation-menu'

import type { Book } from "@/types";

export default function Navbar() {
  const { user } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const links = [
    { href: '/books', label: 'Books' },
    { href: '/tags', label: 'Tags' },
    { href: '/about', label: 'About' },
  ]

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
        const res = await fetch(`/api/books/search?query=${encodeURIComponent(query)}`);
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
    setMobileOpen(false)
  }

  return (
    <nav className="border-b bg-card">
      <div className="max-w-6xl mx-auto p-0 flex items-center justify-between">

        {/*--------------------- Left: Navigation ---------------------*/}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="flex [&_a]:text-lg">

            <NavigationMenuItem key="home">
              <NavigationMenuLink asChild>
                <Link
                  key="home"
                  href="/"
                  className={"text-sm font-bold m-1 px-6 py-3 hover:bg-transparent"}
                >
                  PageTitle
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            {links.map(link => {
              const isActive = pathname === link.href
              return (
                <NavigationMenuItem key={link.href}>
                  <NavigationMenuLink asChild>
                    <Link
                      key={link.href}
                      href={link.href}
                      className={"text-sm font-medium transition-colors m-1 px-6 py-2 hover:bg-transparent hover:text-primary"}
                    >
                      {link.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )
            })}

          </NavigationMenuList>
        </NavigationMenu>


        {/*--------------------- Center: Search ---------------------*/}
        <form ref={searchRef} onSubmit={handleSearch} className="w-72 relative">

          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search books…"
            className="bg-background pl-9"
            value={query}
            type='search'
            onFocus={() => setSuggestionsOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setSuggestionsOpen(true);
            }}
          />

          {suggestionsOpen && query.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded border bg-white shadow">
            {isLoading && <div className="px-3 py-2 text-sm text-gray-500">Searching...</div>}
            {!isLoading && suggestions.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">No matching results</div>
            )}
            {!isLoading &&
              suggestions.map((book) => (
                <Link
                  key={book.id}
                  className="cursor-pointer w-full px-2 py-1 block hover:bg-secondary"
                  href={`/books/${book.id}`}
                >
                  <div>{book.title}</div>
                  {book.author && <small className="text-gray-500">{book.author}</small>}
                </Link>
              ))}
          </div>
        )}

        </form>
        

        {/*--------------------- Right: Auth ---------------------*/}
        <div>
          {user ? (
            <AccountMenu />
          ) : (
            <Button asChild>
              <Link href="/login" className="font-medium text-lg transition-colors hover:bg-ring">
                Log in
              </Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
