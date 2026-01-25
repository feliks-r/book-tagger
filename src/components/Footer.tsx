'use client'

import Link from "next/link"

export default function Footer(){
    return (
        <footer className="border-t bg-background text-sm text-muted-foreground">
        <div className="mx-auto max-w-7xl px-6 py-10">
            <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            {/* Learn more */}
            <div>
                <h3 className="mb-3 font-medium text-foreground">Learn more</h3>
                <ul className="space-y-2">
                <li><a href="/about" className="hover:text-foreground">About</a></li>
                <li><a href="/faq" className="hover:text-foreground">FAQ</a></li>
                <li><a href="/changelog" className="hover:text-foreground">Changelog</a></li>
                <li><a href="/privacy" className="hover:text-foreground">Privacy policy</a></li>
                <li><a href="/terms" className="hover:text-foreground">Terms of service</a></li>
                </ul>
            </div>

            {/* Contact */}
            <div>
                <h3 className="mb-3 font-medium text-foreground">Contact</h3>
                <ul className="space-y-2">
                <li>
                    <a href="mailto:contact@sitename.example" className="hover:text-foreground">
                    Email
                    </a>
                </li>
                <li>
                    <a href="https://github.com/yourname/sitename" className="hover:text-foreground">
                    GitHub
                    </a>
                </li>
                <li>
                    <a href="https://discord.gg/yourinvite" className="hover:text-foreground">
                    Discord
                    </a>
                </li>
                </ul>
            </div>

            {/* Help */}
            <div>
                <h3 className="mb-3 font-medium text-foreground">Help Site Name</h3>
                <ul className="space-y-2">
                <li><a href="/donate" className="hover:text-foreground">Donate</a></li>
                <li><a href="/volunteer" className="hover:text-foreground">Volunteer</a></li>
                </ul>
            </div>

            {/* Attribution */}
            <div>
                <h3 className="mb-3 font-medium text-foreground">About this site</h3>
                <p className="leading-relaxed">
                Site Name is a community-driven project for organizing and exploring books.
                </p>
                <p className="mt-2">
                Built and maintained by <span className="text-foreground">Name</span>.
                </p>
            </div>
            </div>

            {/* Bottom bar */}
            <div className="mt-10 border-t pt-6 text-xs flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Site Name. All rights reserved.</p>
            <p className="text-muted-foreground">
                Built with Next.js and Supabase
            </p>
            </div>
        </div>
        </footer>
    )
}