import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowLeft, FileText, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useWorkspace } from "@/hooks/use-workspace";
import { deleteCase, getCase } from "@/lib/cases.functions";
import { getSignedSourceUrl } from "@/lib/uploads.functions";
import { formatStatusLabel } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ReviewSession } from "@/components/case/ReviewSession";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const detailShell = "mx-auto max-w-[900px] px-[60px] py-12 pb-20";

const backLinkClass =
  "mb-8 inline-flex items-center gap-2 text-[14px] text-muted-foreground transition-colors hover:text-foreground";

export const Route = createFileRoute("/_app/cases/$caseId")({
  component: CaseDetailPage,
  notFoundComponent: CaseNotFound,
  errorComponent: CaseError,
});

function CaseNotFound() {
  return (
    <div className={detailShell}>
      <Link to="/cases" className={backLinkClass}>
        <ArrowLeft className="h-4 w-4" />
        All cases
      </Link>
      <h1 className="text-[36px] font-bold leading-[1.1] tracking-[-0.02em] text-foreground">
        Case not found
      </h1>
      <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
        This case may have been removed. Head back to the list to pick another.
      </p>
    </div>
  );
}

function CaseError({ error }: { error: Error }) {
  return (
    <div className={detailShell}>
      <Link to="/cases" className={backLinkClass}>
        <ArrowLeft className="h-4 w-4" />
        All cases
      </Link>
      <h1 className="text-[36px] font-bold leading-[1.1] tracking-[-0.02em] text-foreground">
        Something went wrong
      </h1>
      <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
        {error.message}
      </p>
    </div>
  );
}

type Division = { name: string; fy2024_revenue_share: string };
type FinancialRow = {
  fy: string;
  revenue: number;
  ebitda: number;
  ebitda_margin: string;
};
type Decision = {
  id: string;
  section: string;
  claim: string;
  analyst_rationale_as_written: string;
};
type Content = {
  investment_highlights_as_written?: string[];
  company_profile?: {
    description?: string;
    divisions?: Division[];
  };
  financials?: {
    currency?: string;
    historical?: FinancialRow[];
  };
  decisions?: Decision[];
  management?: { summary?: string };
};

function CaseDetailPage() {
  const { caseId } = Route.useParams();
  const { juniorId } = useWorkspace();
  const fetchCase = useServerFn(getCase);
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["case", caseId, juniorId],
    queryFn: () => fetchCase({ data: { id: caseId, juniorId } }),
  });

  if (isPending) {
    return (
      <div className={detailShell}>
        <div className="text-[14px] text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (isError) {
    return <CaseError error={error as Error} />;
  }

  if (!data) {
    return <CaseNotFound />;
  }

  const content = (data.metadata ?? {}) as Content;
  const highlights = content.investment_highlights_as_written ?? [];
  const profile = content.company_profile;
  const divisions = profile?.divisions ?? [];
  const financials = content.financials;
  const historical = financials?.historical ?? [];
  const decisions = content.decisions ?? [];
  const management = content.management?.summary;

  const decisionGroups = decisions.reduce<Record<string, Decision[]>>(
    (acc, d) => {
      (acc[d.section] = acc[d.section] ?? []).push(d);
      return acc;
    },
    {},
  );

  return (
    <div className={detailShell}>
      <Link to="/cases" className={backLinkClass}>
        <ArrowLeft className="h-4 w-4" />
        All cases
      </Link>

      <header className="mb-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[36px] font-bold leading-[1.1] tracking-[-0.02em] text-foreground">
              {data.title}
            </h1>
            <div className="mt-2 text-[16px] text-foreground">{data.company}</div>
            <div className="mt-1 text-[14px] text-muted-foreground">
              {data.industry}
            </div>
            {data.source_file_path && (
              <SourceFileLink
                caseId={caseId}
                fileName={data.source_file_name ?? "source.pdf"}
              />
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {data.status && (
              <Badge
                variant="outline"
                className="rounded-sm border-border text-[13px] font-normal text-muted-foreground"
              >
                {formatStatusLabel(data.status)}
              </Badge>
            )}
            <DeleteCaseButton caseId={caseId} title={data.title} />
          </div>
        </div>
      </header>

      {highlights.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-[22px] font-bold text-foreground">
            Investment highlights
          </h2>
          <div className="rounded-lg border border-border bg-card">
            <ul className="divide-y divide-border">
              {highlights.map((h, i) => (
                <li
                  key={i}
                  className="px-6 py-4 text-[14px] leading-relaxed text-foreground"
                >
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {profile && (
        <section className="mb-10">
          <h2 className="mb-4 text-[22px] font-bold text-foreground">
            Company profile
          </h2>
          <div className="rounded-lg border border-border bg-card p-6">
            {profile.description && (
              <p className="text-[14px] leading-relaxed text-foreground">
                {profile.description}
              </p>
            )}
            {divisions.length > 0 && (
              <div className="mt-5">
                <div className="mb-2 text-[13px] text-muted-foreground">
                  Divisions
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Division</TableHead>
                      <TableHead className="text-right">
                        FY2024 revenue share
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {divisions.map((d) => (
                      <TableRow key={d.name}>
                        <TableCell className="text-[14px] text-foreground">
                          {d.name}
                        </TableCell>
                        <TableCell className="text-right font-mono text-[14px] text-foreground">
                          {d.fy2024_revenue_share}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </section>
      )}

      {historical.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-1 text-[22px] font-bold text-foreground">
            Financials
          </h2>
          {financials?.currency && (
            <p className="mb-4 text-[14px] text-muted-foreground">
              {financials.currency}
            </p>
          )}
          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>FY</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">EBITDA</TableHead>
                  <TableHead className="text-right">EBITDA margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historical.map((row) => (
                  <TableRow key={row.fy}>
                    <TableCell className="font-mono text-[14px] text-foreground">
                      {row.fy}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[14px] text-foreground">
                      {row.revenue.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[14px] text-foreground">
                      {row.ebitda.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[14px] text-foreground">
                      {row.ebitda_margin}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {Object.keys(decisionGroups).length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-[22px] font-bold text-foreground">
            Decisions
          </h2>
          <div className="space-y-8">
            {Object.entries(decisionGroups).map(([section, items]) => (
              <div key={section}>
                <div className="mb-3 text-[13px] text-muted-foreground">
                  {section}
                </div>
                <div className="rounded-lg border border-border bg-card">
                  <ul className="divide-y divide-border">
                    {items.map((d) => (
                      <li key={d.id} className="p-6">
                        <div className="text-[15px] font-medium leading-snug text-foreground">
                          {d.claim}
                        </div>
                        <div className="mt-2 text-[13px] text-muted-foreground">
                          Rationale: {d.analyst_rationale_as_written}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {management && (
        <section className="mb-10">
          <h2 className="mb-4 text-[22px] font-bold text-foreground">
            Management
          </h2>
          <div className="rounded-lg border border-border bg-card p-6">
            <p className="text-[14px] leading-relaxed text-foreground">
              {management}
            </p>
          </div>
        </section>
      )}

      <ReviewSession
        analystWork={data.metadata}
        company={data.company ?? ""}
        caseId={caseId}
      />
    </div>
  );
}

function SourceFileLink({
  caseId,
  fileName,
}: {
  caseId: string;
  fileName: string;
}) {
  const signFn = useServerFn(getSignedSourceUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { url } = await signFn({ data: { caseId } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3">
      <a
        href="#"
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <FileText className="h-3.5 w-3.5" />
        Source: {fileName}
        {busy ? " · opening…" : ""}
      </a>
      {error && (
        <div className="mt-1 text-[12px] text-danger">{error}</div>
      )}
    </div>
  );
}

function DeleteCaseButton({
  caseId,
  title,
}: {
  caseId: string;
  title: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { juniorId } = useWorkspace();
  const deleteFn = useServerFn(deleteCase);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await deleteFn({ data: { id: caseId, juniorId } });
      await queryClient.invalidateQueries({ queryKey: ["cases", juniorId] });
      setOpen(false);
      router.navigate({ to: "/cases" });
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="Delete case"
          className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-card px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:border-danger hover:text-danger"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-8 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
          onEscapeKeyDown={(e) => {
            if (busy) e.preventDefault();
          }}
          onPointerDownOutside={(e) => {
            if (busy) e.preventDefault();
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogPrimitive.Title className="text-[20px] font-bold text-foreground">
                Delete this case?
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1 text-[13px] text-muted-foreground">
                <span className="text-foreground">{title}</span> will be removed
                along with its uploaded memorandum. Past debriefs are kept.
                This cannot be undone.
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close
              className="rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              disabled={busy}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          {error && (
            <p className="mt-4 text-[13px] text-danger">{error}</p>
          )}

          <div className="mt-6 flex items-center justify-end gap-3">
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                disabled={busy}
                className="inline-flex items-center rounded-md border border-border bg-card px-5 py-2.5 text-[13px] font-bold uppercase tracking-[0.06em] text-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
            </DialogPrimitive.Close>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-[13px] font-bold uppercase tracking-[0.06em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {busy ? "Deleting…" : "Delete case"}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
