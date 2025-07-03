"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
/* import { useRouter } from "next/navigation"; */
import { authClient } from "@/lib/auth-client"; // Replace with your actual auth client import

export function SignInForm() {
  /* const router = useRouter(); */

  const handleSignInWithGitHub = async () => {
    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: process.env.NODE_ENV === 'production' 
        ? "https://next-chat-app-hono-better-auth-2nd.vercel.app/telegramcone"
        : "http://localhost:3001/telegramcone",
    });
     /*  router.push("/dashboard");  */// Fallback if the callbackURL fails
    } catch (error) {
      console.error("Failed to sign in with GitHub:", error);
    }
  };

  const handleSignInWithGoogle = async () => {
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "http://localhost:3001/telegramcone", // Redirect to the dashboard after sign-in
      });
     /*  router.push("/dashboard");  */// Fallback if the callbackURL fails
    } catch (error) {
      console.error("Failed to sign in with GitHub:", error);
    }
  };

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Use your GitHub account to sign in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <Button
            className="w-full"
            type="button"
            onClick={handleSignInWithGitHub}
          >
            Sign in with GitHub
          </Button>
          <Button
            className="w-full"
            type="button"
            onClick={handleSignInWithGoogle}
          >
            Sign in with Google
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account? Sign up
        </p>
      </CardFooter>
    </Card>
  );
}
