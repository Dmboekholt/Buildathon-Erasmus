import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import { getCase } from "@/lib/cases.functions";
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
          </div>
          {data.status && (
            <Badge
              variant="outline"
              className="rounded-sm border-border text-[13px] font-normal text-muted-foreground"
            >
              {data.status}
            </Badge>
          )}
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
