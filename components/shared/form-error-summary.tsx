import { AlertTriangle } from "lucide-react";

import { Card } from "@/components/shared/card";

export function FormErrorSummary({
  title = "There is a problem",
  errors
}: {
  title?: string;
  errors: string[];
}) {
  if (!errors.length) {
    return null;
  }

  return (
    <Card className="animate-pop-in border-rose-200 bg-rose-50/90">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
        <div>
          <h3 className="text-base font-semibold text-rose-900">{title}</h3>
          <ul className="mt-3 space-y-2 text-sm text-rose-800">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
