import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronRight } from "lucide-react";

import { PageEyebrow } from "@/components/layout/PageEyebrow";
import { PriorityBadge } from "@/components/layout/PriorityBadge";
import { UploadMemorandumDialog } from "@/components/case/UploadMemorandumDialog";
import { useWorkspace } from "@/hooks/use-workspace";
import { listCases } from "@/lib/cases.functions";
import { formatStatusLabel } from "@/lib/utils";

export const Route = createFileRoute("/_app/cases/")({
  component: CasesPage,
});

function CasesPage() {
  const { juniorId } = useWorkspace();
  const fetchCases = useServerFn(listCases);
  const { data, isLoading } = useQuery({
    queryKey: ["cases", juniorId],
    queryFn: () => fetchCases({ data: { juniorId } }),
  });

  const cases = data ?? [];

  return (
    <div className="mx-auto max-w-[1280px] px-[60px] py-20">
      <header className="mb-10 flex items-start justify-between gap-6">
        <div>
          <PageEyebrow index="02" label="Current work" />
          <h1 className="mt-3 text-[36px] font-bold leading-[1.1] tracking-[-0.015em] text-foreground">
            Available for review
          </h1>
          <p className="mt-2 max-w-2xl text-caption text-muted-foreground">
            Memoranda and engagements assigned for voice review.
          </p>
        </div>
        <UploadMemorandumDialog />
      </header>

      <section>
        <h2 className="mb-6 text-[20px] font-bold text-foreground">
          Memoranda and engagements
        </h2>
        {isLoading ? (
          <p className="text-[14px] text-muted-foreground">Loading…</p>
        ) : cases.length === 0 ? (
          <p className="text-[14px] text-muted-foreground">No cases yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {cases.map((c) => (
              <Link
                key={c.id}
                to="/cases/$caseId"
                params={{ caseId: c.id }}
                className="group flex items-center gap-4 rounded-lg border border-border bg-card px-6 py-5 transition-colors hover:bg-muted"
              >
                <div className="min-w-0 flex-1">
                  {c.status ? (
                    <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
                      {formatStatusLabel(c.status)}
                    </p>
                  ) : null}
                  <h3 className="mt-0.5 text-[16px] font-bold leading-snug text-foreground group-hover:text-primary">
                    {c.title}
                  </h3>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    {c.company}
                    {c.industry ? ` · ${c.industry}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {c.priority ? <PriorityBadge priority={c.priority} /> : null}
                  <ChevronRight className="h-5 w-5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
