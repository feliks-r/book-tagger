"use client"

import React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import {
  Menu,
  Book,
  CirclePlus,
  LibraryBig,
  Tag,
  Tags,
  Search,
  SquareCheckBig,
  Info,
  HelpCircle,
  BookOpen,
  Mail,
  Heart,
  ChevronDown,
  UserIcon,
  Bell,
  Settings,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User } from "@supabase/supabase-js"
import type { Profile } from "@/types";

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
}

interface NavSection {
  title: string
  href: string
  icon: React.ReactNode
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: "Books",
    href: "/books/explore",
    icon: <Book className="size-4" />,
    items: [
      {
        title: "Explore",
        href: "/books/explore",
        icon: <Search className="size-4" />,
      },
      {
        title: "My Books",
        href: "/books/my-books",
        icon: <LibraryBig className="size-4" />,
      },
      {
        title: "Add a Book",
        href: "/books/add",
        icon: <CirclePlus className="size-4" />,
      },
    ],
  },
  {
    title: "Tags",
    href: "/tags/search",
    icon: <Tag className="size-4" />,
    items: [
      {
        title: "Search",
        href: "/tags/search",
        icon: <Search className="size-4" />,
      },
      {
        title: "My Tags",
        href: "/tags/my-tags",
        icon: <Tags className="size-4" />,
      },
      {
        title: "Vote for New Tags",
        href: "/tags/vote",
        icon: <SquareCheckBig className="size-4" />,
      },
    ],
  },
  {
    title: "About",
    href: "/about",
    icon: <Info className="size-4" />,
    items: [
      {
        title: "About Us",
        href: "/about",
        icon: <Info className="size-4" />,
      },
      {
        title: "FAQ",
        href: "/about/faq",
        icon: <HelpCircle className="size-4" />,
      },
      {
        title: "Guide",
        href: "/about/guide",
        icon: <BookOpen className="size-4" />,
      },
      {
        title: "Contact",
        href: "/about/contact",
        icon: <Mail className="size-4" />,
      },
      {
        title: "Support Us",
        href: "/about/support",
        icon: <Heart className="size-4" />,
      },
    ],
  },
]

interface MobileNavSectionProps {
  section: NavSection
  onNavigate: () => void
}

function MobileNavSection({ section, onNavigate }: MobileNavSectionProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          <span className="flex items-center gap-3">
            <span className="text-muted-foreground">{section.icon}</span>
            {section.title}
          </span>
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down">
        <div className="ml-4 mt-1 flex flex-col gap-1 border-l pl-4">
          {section.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {item.icon}
              {item.title}
            </Link>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

interface MobileMenuProps {
  user: User | null
  profile: Profile | null
  onLogIn?: () => void
  onLogOut?: () => void
}

export function MobileMenu({ user, profile, onLogIn, onLogOut }: MobileMenuProps) {
  const [open, setOpen] = useState(false)

  const handleNavigate = () => {
    setOpen(false)
  }

  const initials = profile?.username
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden m-2">
          <Menu className="size-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle className="flex items-center gap-2 text-left">
            <Book className="size-5" />
            BookShelf
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-y-auto">

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <div className="flex flex-col gap-1">
              {navSections.map((section) => (
                <MobileNavSection
                  key={section.title}
                  section={section}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>
          </nav>

          <Separator />

          {/* User Section */}
          <div className="p-4">
            {profile ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 rounded-md px-3 py-2">
                  <Avatar className="size-10">
                    <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.username} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{profile.username}</span>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Link
                    href="/profile"
                    onClick={handleNavigate}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                  >
                    <UserIcon className="size-4 text-muted-foreground" />
                    Profile
                  </Link>
                  <Link
                    href="/notifications"
                    onClick={handleNavigate}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                  >
                    <Bell className="size-4 text-muted-foreground" />
                    Notifications
                  </Link>
                  <Link
                    href="/settings"
                    onClick={handleNavigate}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                  >
                    <Settings className="size-4 text-muted-foreground" />
                    Settings
                  </Link>
                </div>
                <Separator className="my-2" />
                <button
                  type="button"
                  onClick={() => {
                    onLogOut?.()
                    handleNavigate()
                  }}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut className="size-4" />
                  Log Out
                </button>
              </div>
            ) : (
              <Button
                className="w-full"
                onClick={() => {
                  onLogIn?.()
                  handleNavigate()
                }}
              >
                Log In
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
