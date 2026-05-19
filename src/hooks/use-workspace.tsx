import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type WorkspaceMode = "junior" | "manager";

const MODE_KEY = "workspaceMode";
const MANAGER_KEY = "activeManagerId";
const JUNIOR_KEY = "activeJuniorId";

const DEFAULT_MANAGER = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const DEFAULT_JUNIOR = "11111111-1111-1111-1111-111111111111";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function safe(value: string | null, fallback: string) {
  return value && UUID_RE.test(value) ? value : fallback;
}

function readMode(): WorkspaceMode {
  if (typeof window === "undefined") return "junior";
  return (localStorage.getItem(MODE_KEY) as WorkspaceMode) || "junior";
}

export function getActiveManagerId(): string {
  if (typeof window === "undefined") return DEFAULT_MANAGER;
  return safe(localStorage.getItem(MANAGER_KEY), DEFAULT_MANAGER);
}

export function getActiveJuniorId(): string {
  if (typeof window === "undefined") return DEFAULT_JUNIOR;
  return safe(localStorage.getItem(JUNIOR_KEY), DEFAULT_JUNIOR);
}

export function setWorkspaceMode(mode: WorkspaceMode) {
  localStorage.setItem(MODE_KEY, mode);
}

export function setActiveManagerId(id: string) {
  localStorage.setItem(MANAGER_KEY, id);
}

export function setActiveJuniorId(id: string) {
  localStorage.setItem(JUNIOR_KEY, id);
}

type WorkspaceContextValue = {
  mode: WorkspaceMode;
  managerId: string;
  juniorId: string;
  switchMode: (next: WorkspaceMode) => void;
  selectManager: (id: string) => void;
  selectJunior: (id: string) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<WorkspaceMode>("junior");
  const [managerId, setManagerId] = useState(DEFAULT_MANAGER);
  const [juniorId, setJuniorId] = useState(DEFAULT_JUNIOR);

  useEffect(() => {
    setMode(readMode());
    setManagerId(getActiveManagerId());
    setJuniorId(getActiveJuniorId());
  }, []);

  const switchMode = useCallback((next: WorkspaceMode) => {
    setWorkspaceMode(next);
    setMode(next);
  }, []);

  const selectManager = useCallback((id: string) => {
    setActiveManagerId(id);
    setManagerId(id);
  }, []);

  const selectJunior = useCallback((id: string) => {
    setActiveJuniorId(id);
    setJuniorId(id);
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        mode,
        managerId,
        juniorId,
        switchMode,
        selectManager,
        selectJunior,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return ctx;
}
