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
          router.replace(searchParams.get("next") || "/dashboard");
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
        const next = searchParams.get("next") || "/dashboard";
        router.replace(next);
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
    <Card className="w-full max-w-lg border-brand/10 bg-white">
      <div className="mb-8 flex rounded-2xl bg-slate-100 p-1">
        <button
          className={`flex-1 rounded-2xl px-4 py-2 text-sm font-semibold ${mode === "login" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
          onClick={() => setMode("login")}
          type="button"
        >
          Login
        </button>
        <button
          className={`flex-1 rounded-2xl px-4 py-2 text-sm font-semibold ${mode === "signup" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
          onClick={() => setMode("signup")}
          type="button"
        >
          Signup
        </button>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {mode === "signup" ? (
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Full name</span>
            <input
              required
              name="fullName"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand"
              placeholder="House admin"
            />
          </label>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
          <input
            required
            type="email"
            name="email"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand"
            placeholder="you@example.com"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
          <input
            required
            type="password"
            minLength={6}
            name="password"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand"
            placeholder="Minimum 6 characters"
          />
        </label>

        {mode === "signup" ? (
          <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            If Supabase email confirmation is enabled, signup will create the account but you must verify the email before the first login.
          </p>
        ) : null}

        {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        {success ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}

        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
        </Button>
      </form>
    </Card>
  );
}
