"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

import { GoogleIcon } from "@/components/auth/google-icon";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { signUpSchema } from "@/lib/validations/auth";

export function SignupForm() {
  const supabase = useMemo(() => createClient(), []);
  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/api/auth/callback` : "";

  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isStartingGoogle, setIsStartingGoogle] = useState(false);

  async function handleEmailSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSignupError(null);
    setSignupSuccess(null);

    const formData = new FormData(event.currentTarget);
    const payload = signUpSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
      fullName: formData.get("fullName"),
    });

    if (!payload.success) {
      setSignupError(payload.error.issues[0]?.message ?? "Enter valid account details.");
      return;
    }

    try {
      setIsCreatingAccount(true);
      const { error } = await supabase.auth.signUp({
        email: payload.data.email,
        password: payload.data.password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            full_name: payload.data.fullName,
          },
        },
      });

      if (error) {
        setSignupError(error.message);
        return;
      }

      setSignupSuccess("Account created. Check your inbox to confirm your email.");
      event.currentTarget.reset();
    } catch (error) {
      setSignupError(
        error instanceof Error ? error.message : "Unable to create your account right now.",
      );
    } finally {
      setIsCreatingAccount(false);
    }
  }

  async function handleGoogleSignup() {
    setOauthError(null);

    try {
      setIsStartingGoogle(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        setOauthError(error.message);
        return;
      }

      if (data.url) {
        window.location.assign(data.url);
      }
    } catch (error) {
      setOauthError(
        error instanceof Error ? error.message : "Unable to start Google sign-up right now.",
      );
    } finally {
      setIsStartingGoogle(false);
    }
  }

  return (
    <Card className="border-white/70 bg-white/90 backdrop-blur">
      <CardContent className="space-y-6 p-6 sm:p-7">
        <Button
          className="w-full"
          type="button"
          variant="outline"
          onClick={handleGoogleSignup}
          disabled={isStartingGoogle}
        >
          <GoogleIcon />
          {isStartingGoogle ? "Connecting Google..." : "Continue with Google"}
        </Button>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            Or use email
          </span>
          <Separator className="flex-1" />
        </div>

        <form className="space-y-4" onSubmit={handleEmailSignup}>
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" name="fullName" autoComplete="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/login" className="text-sm font-medium text-teal-700 hover:text-teal-800">
                Already have an account?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
            />
          </div>
          {signupError ? <Alert variant="destructive">{signupError}</Alert> : null}
          {oauthError ? <Alert variant="destructive">{oauthError}</Alert> : null}
          {signupSuccess ? <Alert>{signupSuccess}</Alert> : null}
          <Button className="w-full" type="submit" disabled={isCreatingAccount}>
            {isCreatingAccount ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
