import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/curriculum")({
  component: CurriculumLayout,
});

function CurriculumLayout() {
  return <Outlet />;
}
