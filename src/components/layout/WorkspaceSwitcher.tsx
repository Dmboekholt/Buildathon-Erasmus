import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LayoutDashboard, Users } from "lucide-react";
import { useWorkspace, type WorkspaceMode } from "@/hooks/use-workspace";
import { listManagers } from "@/lib/manager.functions";

const JUNIOR_LABELS: Record<string, string> = {
  "11111111-1111-1111-1111-111111111111": "Sam Patel",
  "22222222-2222-2222-2222-222222222222": "Priya Sharma",
  "33333333-3333-3333-3333-333333333333": "Tom Okonkwo",
};

export function WorkspaceSwitcher({ mode }: { mode: WorkspaceMode }) {
  const navigate = useNavigate();
  const { managerId, juniorId, selectManager, selectJunior, switchMode } =
    useWorkspace();
  const fetchManagers = useServerFn(listManagers);
  const { data: managers } = useQuery({
    queryKey: ["managers"],
    queryFn: () => fetchManagers(),
    enabled: mode === "manager",
  });

  const goToManager = () => {
    switchMode("manager");
    navigate({ to: "/manager" });
  };

  const goToJunior = () => {
    switchMode("junior");
    navigate({ to: "/" });
  };

  return (
    <div className="mt-auto flex flex-col gap-3 border-t border-sidebar-border px-2 py-3 group-data-[collapsible=icon]:hidden">
      {mode === "junior" && (
        <>
          <div>
            <label
              htmlFor="acting-junior"
              className="mb-1 block text-caption text-muted-foreground"
            >
              Acting as
            </label>
            <select
              id="acting-junior"
              value={juniorId}
              onChange={(e) => selectJunior(e.target.value)}
              className="w-full rounded-sm border border-border bg-background px-2 py-1.5 text-caption text-foreground"
            >
              {Object.entries(JUNIOR_LABELS).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={goToManager}
            className="flex w-full items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-left text-caption text-foreground transition-colors hover:border-foreground/40 hover:bg-muted/50"
          >
            <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>Management dashboard</span>
          </button>
        </>
      )}

      {mode === "manager" && (
        <>
          <div>
            <label
              htmlFor="acting-manager"
              className="mb-1 block text-caption text-muted-foreground"
            >
              Acting as
            </label>
            <select
              id="acting-manager"
              value={managerId}
              onChange={(e) => selectManager(e.target.value)}
              className="w-full rounded-sm border border-border bg-background px-2 py-1.5 text-caption text-foreground"
            >
              {(managers ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={goToJunior}
            className="flex w-full items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-left text-caption text-foreground transition-colors hover:border-foreground/40 hover:bg-muted/50"
          >
            <LayoutDashboard className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>Junior workspace</span>
          </button>
        </>
      )}
    </div>
  );
}
