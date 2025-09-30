"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-primary tracking-tight">
            RadioAlice
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            <Link href="/" className="text-sm font-medium text-foreground/60 transition-colors hover:text-foreground">
              History
            </Link>
            <Link
              href="/tracklist"
              className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              Tracklist
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-9 w-9 items-center justify-center text-foreground transition-colors hover:text-primary md:hidden"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <nav className="border-t border-border/40 bg-background/95 backdrop-blur-sm md:hidden">
            <div className="container mx-auto flex flex-col gap-1 px-6 py-3">
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/60 transition-colors hover:text-foreground"
              >
                History
              </Link>
              <Link
                href="/tracklist"
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                Tracklist
              </Link>
            </div>
          </nav>
        )}
      </header>
    </>
  )
}
