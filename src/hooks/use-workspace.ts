import { useCallback, useEffect, useState } from "react";

export type WorkspaceMode = "junior" | "manager";

const MODE_KEY = "workspaceMode";
const MANAGER_KEY = "activeManagerId";
const JUNIOR_KEY = "activeJuniorId";

const DEFAULT_MANAGER = "22222222-2222-2222-2222-222222222222";
const DEFAULT_JUNIOR = "11111111-1111-1111-1111-111111111111";

function readMode(): WorkspaceMode {
  if (typeof window === "undefined") return "junior";
  return (localStorage.getItem(MODE_KEY) as WorkspaceMode) || "junior";
}

export function getActiveManagerId(): string {
  if (typeof window === "undefined") return DEFAULT_MANAGER;
  return localStorage.getItem(MANAGER_KEY) || DEFAULT_MANAGER;
}

export function getActiveJuniorId(): string {
  if (typeof window === "undefined") return DEFAULT_JUNIOR;
  return localStorage.getItem(JUNIOR_KEY) || DEFAULT_JUNIOR;
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

export function useWorkspace() {
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

  return {
    mode,
    managerId,
    juniorId,
    switchMode,
    selectManager,
    selectJunior,
  };
}
