"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const items = [
  { href: "/", label: "Generate" },
  { href: "/gallery", label: "Gallery" },
  { href: "/history", label: "History" },
] as const

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-48 shrink-0 border-r pr-4">
      <nav className="flex flex-col gap-1 py-4 text-sm">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-left transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

