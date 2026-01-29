"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Database } from "lucide-react"

export function DbTestLink() {
  const pathname = usePathname()
  const isActive = pathname === "/db-test"

  return (
    <Link
      href="/db-test"
      className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
        isActive ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      <Database className="h-4 w-4" />
      <span>DB Test</span>
    </Link>
  )
}
