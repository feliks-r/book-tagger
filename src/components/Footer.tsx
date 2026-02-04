'use client'

import Link from 'next/link'

export default function Footer(){
    return (
        <footer className="border-t bg-card text-sm text-muted-foreground">
        <div className="mx-auto max-w-7xl px-6 py-10">
            <div className="grid gap-7 sm:grid-cols-2 md:grid-cols-4">
            {/* Learn more */}
            <div>
                <h3 className="mb-3 font-medium text-foreground">Learn more</h3>
                <ul className="space-y-2">
                <li><Link href="/about" className="hover:text-foreground hover:underline">About</Link></li>
                <li><Link href="/faq" className="hover:text-foreground hover:underline">FAQ</Link></li>
                <li><Link href="/changelog" className="hover:text-foreground hover:underline">Changelog</Link></li>
                <li><Link href="/roadmap" className="hover:text-foreground hover:underline">Roadmap</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground hover:underline">Privacy policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground hover:underline">Terms of service</Link></li>
                </ul>
            </div>

            {/* Contact */}
            <div>
                <h3 className="mb-3 font-medium text-foreground">Contact</h3>
                <ul className="space-y-2">
                <li>
                    E-mail: 
                    <a href="mailto:contact@sitename.example" className="hover:text-foreground hover:underline ml-1 inline-block">
                      contact@sitename.example
                    </a>
                </li>
                {/*<li>
                    <a href="https://github.com/yourname/sitename" className="hover:text-foreground">
                    GitHub
                    </a>
                </li>*/}
                <li>
                    <a href="https://discord.gg/yourinvite" className="hover:text-foreground hover:underline">
                    Join our Discord server
                    </a>
                </li>
                </ul>
            </div>

            {/* Help */}
            <div>
                <h3 className="mb-3 font-medium text-foreground">Help Site Name</h3>
                <ul className="space-y-2">
                <li><Link href="/donate" className="hover:text-foreground hover:underline">Donate</Link></li>
                <li><Link href="/volunteer" className="hover:text-foreground hover:underline">Volunteer</Link></li>
                <li><Link href="/volunteer" className="hover:text-foreground hover:underline">Suggest changes</Link></li>
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