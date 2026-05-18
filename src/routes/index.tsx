import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/layout/AppShell";
import { listTasks, listImprovements } from "@/lib/tasks.functions";
import { ArrowUpRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: () => <AppShell />,
});

// Index page renders inside <Outlet /> from AppShell? No — the route owns its
// own layout. Re-using AppShell as a layout: see tasks routes for nested
// pattern. For simplicity the Home page IS the AppShell with a body slot.
// We mount the page via a child route. To keep this MVP simple, render
// directly:

export const HomePage = HomeInner;

function HomeInner() {
  const router = useRouter();
  void router;
  return null;
}
