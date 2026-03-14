"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { Button } from "@/components/shared/button";
import { Card } from "@/components/shared/card";
import { useToast } from "@/components/shared/toast-provider";
import { isSupabaseConfigured } from "@/lib/config";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function normalizeAuthMessage(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("email not confirmed") || lower.includes("email_not_confirmed")) {
    return "Your email is not confirmed yet. Open the verification email from Supabase, confirm the account, then sign in again.";
  }

  return message;
}

export function AuthPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams?.get("next") ?? "/dashboard";
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured) {
      const text = "Supabase credentials are required for real authentication. Open the dashboard to view demo data.";
      setError(text);
      toast(text, "error");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();
    const fullName = String(formData.get("fullName") ?? "").trim();

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createSupabaseBrowserClient();

      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName
            }
          }
        });

        if (signUpError) {
          throw signUpError;
        }

        if (data.session) {
          toast("Account created. Redirecting to dashboard.");
          router.replace(redirectPath);
          router.refresh();
          return;
        }

        const text = `Account created for ${email}. Email confirmation is enabled, so you need to open the verification email from Supabase before you can sign in.`;
        setSuccess(text);
        toast("Account created. Check your email to confirm the account.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

        if (signInError) {
          throw new Error(normalizeAuthMessage(signInError.message));
        }

        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (!session) {
          throw new Error("Login succeeded, but no session was created. Check your Supabase auth settings.");
        }

        toast("Logged in successfully.");
        router.replace(redirectPath);
        router.refresh();
      }
    } catch (submitError) {
      const text = submitError instanceof Error ? normalizeAuthMessage(submitError.message) : "Unable to continue.";
      setError(text);
      toast(text, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-lg border-brand/10">
      <div className="app-segmented mb-8 flex rounded-2xl p-1">
        <button
          className={`flex-1 rounded-2xl px-4 py-2 text-sm font-semibold transition ${mode === "login" ? "app-segmented-button-active" : "app-segmented-button"}`}
          onClick={() => setMode("login")}
          type="button"
        >
          Login
        </button>
        <button
          className={`flex-1 rounded-2xl px-4 py-2 text-sm font-semibold transition ${mode === "signup" ? "app-segmented-button-active" : "app-segmented-button"}`}
          onClick={() => setMode("signup")}
          type="button"
        >
          Signup
        </button>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {mode === "signup" ? (
          <label className="block">
            <span className="app-label mb-2 block text-sm font-medium">Full name</span>
            <input
              required
              name="fullName"
              className="app-input"
              placeholder="House admin"
            />
          </label>
        ) : null}

        <label className="block">
          <span className="app-label mb-2 block text-sm font-medium">Email</span>
          <input
            required
            type="email"
            name="email"
            className="app-input"
            placeholder="you@example.com"
          />
        </label>

        <label className="block">
          <span className="app-label mb-2 block text-sm font-medium">Password</span>
          <input
            required
            type="password"
            minLength={6}
            name="password"
            className="app-input"
            placeholder="Minimum 6 characters"
          />
        </label>

        {mode === "signup" ? (
          <p className="app-notice-info rounded-2xl px-4 py-3 text-sm">
            If Supabase email confirmation is enabled, signup will create the account but you must verify the email before the first login.
          </p>
        ) : null}

        {error ? <p className="app-notice-error rounded-2xl px-4 py-3 text-sm">{error}</p> : null}
        {success ? <p className="app-notice-success rounded-2xl px-4 py-3 text-sm">{success}</p> : null}

        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
        </Button>
      </form>
    </Card>
  );
}
