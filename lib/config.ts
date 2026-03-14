export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const appConfig = {
  name: "SplitBill AI",
  description:
    "A production-ready electricity billing dashboard for multi-member houses powered by Next.js and Supabase.",
  storageBucket: "meter-images"
};

