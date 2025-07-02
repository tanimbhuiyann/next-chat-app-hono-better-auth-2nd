import { betterAuth } from "better-auth";
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




// In lib/auth.ts, update the redirect URIs:
/* 
const productionUrl = process.env.BETTER_AUTH_URL || "https://your-backend-url.onrender.com";
const isDevelopment = process.env.NODE_ENV === 'development';

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
        : `${productionUrl}/api/auth/callback/github`,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      redirectURI: isDevelopment
        ? "http://localhost:3000/api/auth/callback/google"
        : `${productionUrl}/api/auth/callback/google`,
    },
  },
  trustedOrigins: isDevelopment 
    ? ["http://localhost:3000", "http://localhost:3001"]
    : [productionUrl, process.env.FRONTEND_URL || "https://your-app.vercel.app"],
}); */