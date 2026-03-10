import { io, Socket } from "socket.io-client"

const socketUrl =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_SOCKET_URL ||
        process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
        "http://localhost:4000")
    : ""

let socket: Socket | null = null

export function getSocket(): Socket | null {
  if (typeof window === "undefined") return null
  if (!socket) {
    socket = io(socketUrl, {
      autoConnect: true,
      path: "/socket.io",
    })
  }
  return socket
}
