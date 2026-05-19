import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/curriculum")({
  component: CurriculumPage,
});

function CurriculumPage() {
  return (
    <div className="mx-auto max-w-[1280px] py-20 px-[60px]">
      <div className="eyebrow mb-4">Netherlands · Learning</div>
      <h1 className="text-[44px] font-bold leading-[1.1] tracking-[-0.01em] text-foreground">
        Learning curriculum.
      </h1>
      <p className="mt-6 max-w-2xl text-body text-foreground">
        Your personalized learning path will appear here.
      </p>
    </div>
  );
}
