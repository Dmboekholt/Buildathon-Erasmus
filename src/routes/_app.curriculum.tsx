import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/curriculum")({
  component: CurriculumPage,
});

function CurriculumPage() {
  return (
    <div className="mx-auto max-w-[1280px] py-16 px-[60px]">
      <h1 className="text-3xl font-medium tracking-tight">Learning curriculum</h1>
      <p className="mt-3 text-muted-foreground">
        Your personalized learning path will appear here.
      </p>
    </div>
  );
}
