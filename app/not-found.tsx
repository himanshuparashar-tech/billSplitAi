import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="max-w-lg rounded-[32px] border border-[color:var(--border-soft)] bg-[color:var(--bg-card)] p-8 text-center shadow-panel backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">404</p>
        <h1 className="mt-4 text-3xl font-semibold text-[color:var(--text-primary)]">Page not found</h1>
        <p className="mt-4 text-sm leading-7 text-[color:var(--text-secondary)]">
          The house, bill, or route you requested does not exist or is not available to this account.
        </p>
        <Link href="/" className="mt-6 inline-flex rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white">
          Return home
        </Link>
      </div>
    </main>
  );
}
