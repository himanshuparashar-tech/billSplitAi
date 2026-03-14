import { Card } from "@/components/shared/card";
import { Skeleton } from "@/components/shared/skeleton";

export default function BillingLoading() {
  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-slate-900/82">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="mt-4 h-10 w-80 max-w-full" />
        <Skeleton className="mt-4 h-5 w-full max-w-3xl" />
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="bg-white dark:bg-slate-900/82">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-5 w-40" />
            <Skeleton className="mt-4 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
          </Card>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.32fr_0.68fr]">
        <Card className="bg-white dark:bg-slate-900/82">
          <Skeleton className="h-5 w-36" />
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
          <Skeleton className="mt-8 h-[340px] w-full rounded-[24px]" />
        </Card>

        <Card className="bg-white dark:bg-slate-900/82">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-5 h-28 w-full rounded-[24px]" />
          <Skeleton className="mt-4 h-40 w-full rounded-[24px]" />
          <Skeleton className="mt-4 h-10 w-full" />
          <Skeleton className="mt-3 h-10 w-full" />
        </Card>
      </div>
    </div>
  );
}

