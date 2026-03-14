import { notFound } from "next/navigation";

import { AddMemberForm } from "@/components/forms/add-member-form";
import { ManageRoomActions } from "@/components/forms/manage-room-actions";
import { Card } from "@/components/shared/card";
import { DemoBanner } from "@/components/shared/demo-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHero } from "@/components/shared/page-hero";
import { getHousesForViewer, getMembersForHouse, getViewer } from "@/lib/data";
import { demoViewer } from "@/lib/demo/seed-data";

export default async function MembersPage({ params }: { params: { houseId: string } }) {
  const viewer = (await getViewer()) ?? demoViewer;
  const houses = await getHousesForViewer(viewer);
  const house = houses.find((entry) => entry.id === params.houseId) ?? null;

  if (!house) {
    notFound();
  }

  const members = await getMembersForHouse(viewer, house.id, { includeInactive: true });

  return (
    <div className="space-y-6">
      {viewer.isDemo ? <DemoBanner /> : null}

      <PageHero
        eyebrow="Rooms"
        title={`Manage rooms for ${house.name}`}
        description="Keep room names short and obvious. These names appear in the reading table, exports, and public bill pages. Rooms already used in bill history are archived instead of fully deleted."
      />

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="animate-fade-up border-brand/10 bg-white dark:border-white/10 dark:bg-slate-900/82">
          <h2 className="text-2xl font-semibold text-ink dark:text-slate-50">Add a room</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Put the form first so the add action is immediately visible. Examples: Room 101, Ground Floor, Studio A.
          </p>
          <div className="mt-6">
            <AddMemberForm houseId={house.id} disabled={viewer.isDemo} />
          </div>
        </Card>
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-ink dark:text-slate-50">Current rooms</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Active rooms appear in billing. Archived rooms stay hidden from new bills but preserve history.</p>
          </div>
          {members.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {members.map((member, index) => (
                <Card key={member.id} className="animate-fade-up border-accent/10 bg-white dark:border-white/10 dark:bg-slate-900/82" style={{ animationDelay: `${index * 90}ms` }}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent dark:text-blue-200">Billing room</p>
                      <h3 className="mt-3 text-xl font-semibold text-ink dark:text-slate-50">{member.name}</h3>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${member.is_active !== false ? "bg-brand-soft text-brand-dark dark:bg-brand/15 dark:text-brand" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
                      {member.is_active !== false ? "Active" : "Archived"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                    {member.is_active !== false
                      ? "Use this room in the monthly reading and split-bill workflow."
                      : "This room is archived and excluded from new billing, but past bill history remains intact."}
                  </p>
                  <div className="mt-5 border-t border-slate-200 pt-5 dark:border-white/10">
                    <ManageRoomActions
                      roomId={member.id}
                      initialName={member.name}
                      disabled={viewer.isDemo}
                      isActive={member.is_active !== false}
                    />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState title="No rooms yet" description="Add rooms before entering a monthly bill." />
          )}
        </div>
      </section>
    </div>
  );
}
