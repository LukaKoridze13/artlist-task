"use client"

import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function Header() {
  const { data } = useSession()
  const username = data?.user?.name

  return (
    <header className="flex items-center justify-between py-4">
      <div className="text-lg font-semibold">Artlist</div>
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
    </header>
  )
}
