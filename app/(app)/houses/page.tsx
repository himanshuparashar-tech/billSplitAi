import Link from "next/link";

import { CreateHouseForm } from "@/components/forms/create-house-form";
import { ManageHouseActions } from "@/components/forms/manage-house-actions";
import { Card } from "@/components/shared/card";
import { DemoBanner } from "@/components/shared/demo-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHero } from "@/components/shared/page-hero";
import { getHousesForViewer, getViewer } from "@/lib/data";
import { demoViewer } from "@/lib/demo/seed-data";

export default async function HousesPage() {
  const viewer = (await getViewer()) ?? demoViewer;
  const houses = await getHousesForViewer(viewer);

  return (
    <div className="space-y-6">
      {viewer.isDemo ? <DemoBanner /> : null}

      <PageHero
        eyebrow="Houses"
        title="Keep each property organized"
        description="Start with the house, then add members, enter readings, and finalize the monthly bill. You can also rename or delete a house from this screen whenever the structure changes."
      />

      <section className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <Card className="animate-fade-up border-brand/10 bg-white dark:border-white/10 dark:bg-slate-900/82">
          <h2 className="text-2xl font-semibold text-ink dark:text-slate-50">Create a house</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Use a clear name people recognize instantly. A good house setup reduces confusion later when bills and
            public links are shared.
          </p>

          <div className="mt-5 grid gap-3 rounded-3xl bg-gradient-to-br from-brand-soft/70 to-accent-soft/60 p-4 text-sm text-slate-700 dark:from-brand/15 dark:to-accent/15 dark:text-slate-200">
            <p>1. Create the house.</p>
            <p>2. Add members.</p>
            <p>3. Enter readings and finalize the month.</p>
          </div>

          <div className="mt-6">
            <CreateHouseForm disabled={viewer.isDemo} />
          </div>
        </Card>

        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-ink dark:text-slate-50">Your houses</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Open, rename, or remove a house from the same card.</p>
          </div>
          {houses.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {houses.map((house, index) => (
                <Card key={house.id} className="animate-fade-up border-accent/10 bg-white dark:border-white/10 dark:bg-slate-900/82" style={{ animationDelay: `${index * 90}ms` }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent dark:text-blue-200">House</p>
                  <h3 className="mt-3 text-xl font-semibold text-ink dark:text-slate-50">{house.name}</h3>
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Open the workspace to manage members, readings, billing, and shared bill links.</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link href={`/houses/${house.id}`} className="rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white">
                      Overview
                    </Link>
                    <Link href={`/houses/${house.id}/billing`} className="rounded-2xl border border-accent/15 bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:bg-accent-soft/50 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800">
                      Billing
                    </Link>
                  </div>
                  <div className="mt-5 border-t border-slate-200 pt-5 dark:border-white/10">
                    <ManageHouseActions houseId={house.id} initialName={house.name} disabled={viewer.isDemo} />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState title="No houses found" description="Create your first house to start adding members and bills." />
          )}
        </div>
      </section>
    </div>
  );
}
