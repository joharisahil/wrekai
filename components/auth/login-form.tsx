"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { magicLinkSchema, signInSchema } from "@/lib/validations/auth";

const magicLinkMessage =
  "Check your inbox for the secure sign-in link. It can take a minute to arrive.";

function readSearchMessage(
  searchParams: URLSearchParams,
): { type: "success" | "error"; message: string } | null {
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  if (error) {
    return { type: "error", message: error };
  }

  if (message) {
    return { type: "success", message };
  }

  return null;
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/api/auth/callback` : "";

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [magicLinkError, setMagicLinkError] = useState<string | null>(null);
  const [magicLinkSuccess, setMagicLinkSuccess] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);

  const pageAlert = readSearchMessage(searchParams);

  async function handlePasswordLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    const formData = new FormData(event.currentTarget);
    const payload = signInSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!payload.success) {
      setPasswordError(payload.error.issues[0]?.message ?? "Enter a valid email and password.");
      return;
    }

    try {
      setIsSigningIn(true);
      const { error } = await supabase.auth.signInWithPassword(payload.data);

      if (error) {
        setPasswordError(error.message);
        return;
      }

      setPasswordSuccess("Signed in successfully. Redirecting to your workspace...");
      window.location.assign("/dashboard");
    } catch (error) {
      setPasswordError(
        error instanceof Error ? error.message : "Unable to sign you in right now.",
      );
    } finally {
      setIsSigningIn(false);
    }
  }

  async function handleMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMagicLinkError(null);
    setMagicLinkSuccess(null);

    const formData = new FormData(event.currentTarget);
    const payload = magicLinkSchema.safeParse({
      email: formData.get("magic-email"),
    });

    if (!payload.success) {
      setMagicLinkError(payload.error.issues[0]?.message ?? "Enter a valid email address.");
      return;
    }

    try {
      setIsSendingMagicLink(true);
      const { error } = await supabase.auth.signInWithOtp({
        email: payload.data.email,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        setMagicLinkError(error.message);
        return;
      }

      setMagicLinkSuccess(magicLinkMessage);
      event.currentTarget.reset();
    } catch (error) {
      setMagicLinkError(
        error instanceof Error ? error.message : "Unable to send a magic link right now.",
      );
    } finally {
      setIsSendingMagicLink(false);
    }
  }

  return (
    <Card className="border-white/70 bg-white/90 backdrop-blur">
      <CardContent className="space-y-6 p-6 sm:p-7">
        {pageAlert ? (
          <Alert variant={pageAlert.type === "error" ? "destructive" : "default"}>
            {pageAlert.message}
          </Alert>
        ) : null}

        <form className="space-y-4" onSubmit={handlePasswordLogin}>
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/signup" className="text-sm font-medium text-teal-700 hover:text-teal-800">
                Need an account?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {passwordError ? <Alert variant="destructive">{passwordError}</Alert> : null}
          {passwordSuccess ? <Alert>{passwordSuccess}</Alert> : null}
          <Button className="w-full" type="submit" disabled={isSigningIn}>
            {isSigningIn ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            Magic link
          </span>
          <Separator className="flex-1" />
        </div>

        <form className="space-y-4" onSubmit={handleMagicLink}>
          <div className="space-y-2">
            <Label htmlFor="magic-email">Passwordless email</Label>
            <Input id="magic-email" name="magic-email" type="email" autoComplete="email" required />
          </div>
          {magicLinkError ? <Alert variant="destructive">{magicLinkError}</Alert> : null}
          {magicLinkSuccess ? <Alert>{magicLinkSuccess}</Alert> : null}
          <Button className="w-full" type="submit" variant="outline" disabled={isSendingMagicLink}>
            {isSendingMagicLink ? "Sending link..." : "Email me a magic link"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
