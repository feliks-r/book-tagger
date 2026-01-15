'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

import { Button } from '@/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuContent,
  navigationMenuTriggerStyle
} from '@/components/ui/navigation-menu'

import { Menu } from 'lucide-react' //hamburger icon
import {CircleUserRound} from 'lucide-react'

export default function AccountMenu() {

  const supabase = createClient()
  
  async function logout() {
    await supabase.auth.signOut()
  }

  return (
    
    <NavigationMenu>
      <NavigationMenuList className="flex-wrap [&_a]:text-lg">

        <NavigationMenuItem>
          <NavigationMenuTrigger className="py-5 m-1 bg-transparent"><CircleUserRound size={36} strokeWidth={1.3}/></NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[200px] gap-4">
              <li>
                <NavigationMenuLink asChild>
                  <Link href="/settings">Settings</Link>
                </NavigationMenuLink>
                <NavigationMenuLink asChild className="">
                  <Link href="#" onClick={logout}>Log out</Link>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

      </NavigationMenuList>
    </NavigationMenu>
  )
}
