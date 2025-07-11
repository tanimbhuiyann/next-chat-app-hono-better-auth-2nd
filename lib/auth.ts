/* import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db"; // your drizzle instance
import { schema } from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      ...schema,
       
     },
  }),
  emailAndPassword: { 
    enabled: true, 
  }, 
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      redirectURI: "http://localhost:3000/api/auth/callback/github",
    },
    google: { 
      clientId: process.env.GOOGLE_CLIENT_ID as string, 
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, 
      redirectURI: "http://localhost:3000/api/auth/callback/google"
  }, 
  },
  trustedOrigins: ["http://localhost:3000", "http://localhost:3001"],
});
 */



// Update your lib/auth.ts - Replace the trustedOrigins section

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { schema } from "@/db/schema";

const isDevelopment = process.env.NODE_ENV !== 'production';

// FIXED: Updated trusted origins to include your exact Vercel URL
const trustedOrigins = isDevelopment
  ? [
      "http://localhost:3000", // Backend
      "http://localhost:3001", // Frontend
      "http://localhost:3002"  // Socket.io
    ]
  : [
      "https://next-chat-app-hono-better-auth-2nd.onrender.com",
      "https://next-chat-app-hono-better-auth-2nd.vercel.app", // FIXED: Added your exact URL
      process.env.FRONTEND_URL,
      process.env.BETTER_AUTH_URL,
    ].filter(Boolean);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      ...schema,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      redirectURI: isDevelopment
        ? "http://localhost:3000/api/auth/callback/github"
        : `${process.env.BETTER_AUTH_URL}/api/auth/callback/github`,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      redirectURI: isDevelopment
        ? "http://localhost:3000/api/auth/callback/google"
        : `${process.env.BETTER_AUTH_URL}/api/auth/callback/google`,
    },
  },
  trustedOrigins: trustedOrigins, // FIXED: Use the updated trustedOrigins
});