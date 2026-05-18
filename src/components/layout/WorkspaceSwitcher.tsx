import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useWorkspace, type WorkspaceMode } from "@/hooks/use-workspace";
import { listManagers } from "@/lib/manager.functions";
import { getActiveJuniorId } from "@/hooks/use-workspace";

const JUNIOR_LABELS: Record<string, string> = {
  "11111111-1111-1111-1111-111111111111": "Sam Patel",
  "j2222222-2222-2222-2222-222222222222": "Priya Sharma",
  "j3333333-3333-3333-3333-333333333333": "Tom Okonkwo",
};

export function WorkspaceSwitcher({ mode }: { mode: WorkspaceMode }) {
  const navigate = useNavigate();
  const { managerId, switchMode, selectManager, selectJunior } = useWorkspace();
  const juniorId = getActiveJuniorId();
  const fetchManagers = useServerFn(listManagers);
  const { data: managers } = useQuery({
    queryKey: ["managers"],
    queryFn: () => fetchManagers(),
    enabled: mode === "manager",
  });

  const setMode = (next: WorkspaceMode) => {
    switchMode(next);
    navigate({ to: next === "manager" ? "/manager" : "/" });
  };

  return (
    <div className="border-t border-sidebar-border px-2 py-3 group-data-[collapsible=icon]:hidden">
      <div className="mb-2 text-caption text-muted-foreground">Workspace</div>
      <div className="flex gap-1 rounded-md border border-border bg-background p-0.5">
        <button
          type="button"
          onClick={() => setMode("junior")}
          className={[
            "flex-1 rounded-sm px-2 py-1.5 text-caption transition-colors",
            mode === "junior"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          Junior
        </button>
        <button
          type="button"
          onClick={() => setMode("manager")}
          className={[
            "flex-1 rounded-sm px-2 py-1.5 text-caption transition-colors",
            mode === "manager"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          Manager
        </button>
      </div>

      {mode === "manager" && (
        <div className="mt-3">
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
      )}

      {mode === "junior" && (
        <div className="mt-3">
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
      )}
    </div>
  );
}
