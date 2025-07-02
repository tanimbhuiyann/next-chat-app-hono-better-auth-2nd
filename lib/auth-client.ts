/* import { createAuthClient } from "better-auth/react"
export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
}); */

// lib/auth-client.ts
import { createAuthClient } from "better-auth/react"

// Use environment variable for production
const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000"

export const authClient = createAuthClient({
  baseURL: baseURL,
});