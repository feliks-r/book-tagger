"use client"

import Link from "next/link"
import { createClient } from '@/lib/supabase/client'

import { User } from "@supabase/supabase-js"
import type { Profile } from "@/types"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  Bell,
  Settings,
  LibraryBig,
  Tags,
  LogOut,
  UserIcon,
} from "lucide-react"

interface UserMenuProps {
  user?: User | null
  profile?: Profile | null
}

export function UserMenu({ user, profile }: UserMenuProps) {

  const supabase = createClient()
  
  async function logout() {
    await supabase.auth.signOut()
  }

  if (!user) {
    return (
      <Button asChild>
        <Link href="/login" className="font-medium text-lg transition-colors hover:bg-ring">
          Log in
        </Link>
      </Button>
    )
  }

  const initials = profile?.username.charAt(0).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full m-2">
          <Avatar className="size-9">
            <AvatarImage src={profile?.avatar_url || null} alt={profile?.username} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="sr-only">Open user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 mt-1">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="size-10">
            <AvatarImage src={profile?.avatar_url || null} alt={profile?.username} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-0.5">
            <p className="text-sm font-medium">{profile?.username}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <UserIcon className="mr-2 size-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/notifications">
              <Bell className="mr-2 size-4" />
              Notifications
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings className="mr-2 size-4" />
              Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/books/my-books">
              <LibraryBig className="mr-2 size-4" />
              My Books
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/tags/my-tags">
              <Tags className="mr-2 size-4" />
              My Tags
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={logout}
          className="text-destructive-foreground focus:text-destructive-foreground hover:bg-destructive/10 focus:bg-destructive/10"
        >
          <LogOut className="text-destructive-foreground mr-2 size-4 transition-colors" />
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
