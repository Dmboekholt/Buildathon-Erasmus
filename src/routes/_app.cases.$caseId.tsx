import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft } from "lucide-react";
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

export const Route = createFileRoute("/_app/cases/$caseId")({
  component: CaseDetailPage,
  notFoundComponent: CaseNotFound,
  errorComponent: CaseError,
});

function CaseNotFound() {
  return (
    <div className="mx-auto max-w-4xl px-8 py-12">
      <Link
        to="/cases"
        className="mb-6 inline-flex items-center gap-2 text-caption text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All cases
      </Link>
      <h1 className="text-page-title text-foreground">Case not found</h1>
      <p className="mt-2 text-body text-muted-foreground">
        This case may have been removed. Head back to the list to pick another.
      </p>
    </div>
  );
}

function CaseError({ error }: { error: Error }) {
  return (
    <div className="mx-auto max-w-4xl px-8 py-12">
      <Link
        to="/cases"
        className="mb-6 inline-flex items-center gap-2 text-caption text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All cases
      </Link>
      <h1 className="text-page-title text-foreground">Something went wrong</h1>
      <p className="mt-2 text-body text-muted-foreground">{error.message}</p>
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
  const fetchCase = useServerFn(getCase);
  const { data, isLoading } = useQuery({
    queryKey: ["case", caseId],
    queryFn: () => fetchCase({ data: { id: caseId } }),
  });

  if (isLoading || !data) {
    return (
      <div className="mx-auto max-w-4xl px-8 py-12">
        <div className="text-caption text-muted-foreground">Loading…</div>
      </div>
    );
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
    <div className="mx-auto max-w-4xl px-8 py-12">
      <Link
        to="/cases"
        className="mb-6 inline-flex items-center gap-2 text-caption text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All cases
      </Link>

      <header className="mb-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-page-title text-foreground">{data.title}</h1>
            <div className="mt-2 text-body text-foreground">{data.company}</div>
            <div className="mt-1 text-caption text-muted-foreground">
              {data.industry}
            </div>
          </div>
          {data.status && (
            <Badge
              variant="outline"
              className="rounded-sm border-border text-caption font-normal text-muted-foreground"
            >
              {data.status}
            </Badge>
          )}
        </div>
      </header>

      {highlights.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-section text-foreground">
            Investment highlights
          </h2>
          <div className="rounded-md border border-border bg-card">
            <ul className="divide-y divide-border">
              {highlights.map((h, i) => (
                <li key={i} className="px-5 py-3 text-body text-foreground">
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {profile && (
        <section className="mb-10">
          <h2 className="mb-4 text-section text-foreground">Company profile</h2>
          <div className="rounded-md border border-border bg-card px-5 py-5">
            {profile.description && (
              <p className="text-body text-foreground">{profile.description}</p>
            )}
            {divisions.length > 0 && (
              <div className="mt-5">
                <div className="mb-2 text-caption text-muted-foreground">
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
                        <TableCell className="text-body text-foreground">
                          {d.name}
                        </TableCell>
                        <TableCell className="text-right font-mono text-body text-foreground">
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
          <h2 className="mb-1 text-section text-foreground">Financials</h2>
          {financials?.currency && (
            <p className="mb-4 text-caption text-muted-foreground">
              {financials.currency}
            </p>
          )}
          <div className="rounded-md border border-border bg-card">
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
                    <TableCell className="font-mono text-body text-foreground">
                      {row.fy}
                    </TableCell>
                    <TableCell className="text-right font-mono text-body text-foreground">
                      {row.revenue.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-body text-foreground">
                      {row.ebitda.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-body text-foreground">
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
          <h2 className="mb-4 text-section text-foreground">Decisions</h2>
          <div className="space-y-8">
            {Object.entries(decisionGroups).map(([section, items]) => (
              <div key={section}>
                <div className="mb-3 text-caption text-muted-foreground">
                  {section}
                </div>
                <div className="rounded-md border border-border bg-card">
                  <ul className="divide-y divide-border">
                    {items.map((d) => (
                      <li key={d.id} className="px-5 py-4">
                        <div className="text-body text-foreground">
                          {d.claim}
                        </div>
                        <div className="mt-2 text-caption text-muted-foreground">
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
          <h2 className="mb-4 text-section text-foreground">Management</h2>
          <div className="rounded-md border border-border bg-card px-5 py-5">
            <p className="text-body text-foreground">{management}</p>
          </div>
        </section>
      )}

      <div>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
          Start review session
        </Button>
      </div>
    </div>
  );
}
