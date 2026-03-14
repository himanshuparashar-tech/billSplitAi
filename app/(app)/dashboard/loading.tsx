import { Card } from "@/components/shared/card";
import { Skeleton } from "@/components/shared/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden bg-white dark:bg-slate-900/82">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="mt-4 h-10 w-72 max-w-full" />
        <Skeleton className="mt-4 h-5 w-full max-w-3xl" />
        <div className="mt-6 flex gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="bg-white dark:bg-slate-900/82">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-10 w-24" />
            <Skeleton className="mt-3 h-4 w-32" />
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="bg-white dark:bg-slate-900/82 xl:col-span-1">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="mt-2 h-4 w-48" />
            <Skeleton className="mt-6 h-72 w-full rounded-[24px]" />
          </Card>
        ))}
      </section>
    </div>
  );
}

