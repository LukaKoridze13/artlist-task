"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Generate" },
  { href: "/gallery", label: "Gallery" },
  { href: "/history", label: "History" },
] as const

export function Header() {
  const { data } = useSession()
  const username = data?.user?.name
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const close = () => setOpen(false)

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 py-0">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background text-sm md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden text-lg font-semibold md:block">Artlist</div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {username && <span className="text-muted-foreground">{username}</span>}
            {data && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Sign out
              </Button>
            )}
          </div>
        </div>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={close}>
          <div
            className="absolute left-0 top-0 flex h-full w-64 flex-col border-r bg-background p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-base font-semibold">Artlist</span>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background text-xs"
                onClick={close}
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 text-sm">
              {navItems.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href ||
                      pathname.startsWith(item.href + "/")

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
                    onClick={close}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
