"use client"

import React from "react"

import Link from "next/link"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import {
  CirclePlus,
  LibraryBig,
  Tags,
  Search,
  SquareCheckBig,
  Info,
  HelpCircle,
  BookOpen,
  Mail,
  Heart,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  description?: string
}

interface NavSection {
  title: string
  href: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: "Books",
    href: "/books/explore",
    items: [
      {
        title: "Explore",
        href: "/books/explore",
        icon: <Search className="size-4" />,
        description: "Discover new books",
      },
      {
        title: "My Books",
        href: "/my-books",
        icon: <LibraryBig className="size-4" />,
        description: "View your book collection",
      },
      {
        title: "Add a Book",
        href: "/books/add",
        icon: <CirclePlus className="size-4" />,
        description: "Add a new book to the catalog",
      },
    ],
  },
  {
    title: "Tags",
    href: "/tags/search",
    items: [
      {
        title: "Search",
        href: "/tags/search",
        icon: <Search className="size-4" />,
        description: "Search for tags",
      },
      {
        title: "My Tags",
        href: "/tags/my-tags",
        icon: <Tags className="size-4" />,
        description: "View your saved tags",
      },
      {
        title: "Vote for New Tags",
        href: "/tags/vote",
        icon: <SquareCheckBig className="size-4" />,
        description: "Vote on proposed tags",
      },
    ],
  },
  {
    title: "About",
    href: "/about",
    items: [
      {
        title: "About Us",
        href: "/about",
        icon: <Info className="size-4" />,
        description: "Learn about our mission",
      },
      {
        title: "FAQ",
        href: "/about/faq",
        icon: <HelpCircle className="size-4" />,
        description: "Frequently asked questions",
      },
      {
        title: "Guide",
        href: "/about/guide",
        icon: <BookOpen className="size-4" />,
        description: "How to use our platform",
      },
      {
        title: "Contact",
        href: "/about/contact",
        icon: <Mail className="size-4" />,
        description: "Get in touch with us",
      },
      {
        title: "Support Us",
        href: "/about/support",
        icon: <Heart className="size-4" />,
        description: "Help us grow",
      },
    ],
  },
]

function NavLinkItem({ item }: { item: NavItem }) {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={item.href}
          className={cn(
            "flex-row items-start gap-3 rounded-md p-3 transition-colors",
            "hover:bg-accent",
            "focus:bg-accent focus:text-accent-foreground focus:outline-none"
          )}
        >
          <span className="text-muted-foreground flex">{item.icon}</span>
          <div className="mt-0.5 text-sm font-medium leading-none">{item.title}</div>

        </Link>
      </NavigationMenuLink>
    </li>
  )
}

export function NavLinks() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        {navSections.map((section) => (
          <NavigationMenuItem key={section.title}>
            <NavigationMenuTrigger>
              {section.title}
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[280px] gap-0 p-0">
                {section.items.map((item) => (
                  <NavLinkItem key={item.href} item={item} />
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
