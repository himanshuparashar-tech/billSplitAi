import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="max-w-lg rounded-[32px] bg-white/90 p-8 text-center shadow-panel">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">404</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950">Page not found</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          The house, bill, or route you requested does not exist or is not available to this account.
        </p>
        <Link href="/" className="mt-6 inline-flex rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white">
          Return home
        </Link>
      </div>
    </main>
  );
}
