import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { GeneratePage } from "./generate-page"
import { authOptions } from "@/lib/auth"


export default async function Page() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return <GeneratePage />
}
