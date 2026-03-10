import NextAuth, { type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import axios from "axios"

const backendApiUrl =
  process.env.DOCKER_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials.password) {
          return null
        }

          try {
          const { data: user } = await axios.post(
            backendApiUrl + "/auth/login",
            {
              username: credentials.username,
              password: credentials.password,
            }
          )

          return {
            id: user.id,
            name: user.username,
            email: user.email,
            provider: user.provider,
          } as any
        } catch (error: any) {
          return null
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === "google" && profile && "email" in profile) {
        const email = String(profile.email)
        const username =
          "name" in profile && typeof profile.name === "string"
            ? profile.name
            : undefined

        try {
          await axios.post(backendApiUrl + "/auth/oauth", {
            email,
            username,
            provider: "google",
          })
        } catch {
          // If this fails we still allow login, but backend user may not exist yet
        }
      }

      return token
    },
    async session({ session, token }) {
      // expose the JWT token on the client session object for API calls
      // @ts-expect-error augment session with token
      session.token = token
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export const authHandler = NextAuth(authOptions)
