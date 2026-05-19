import { useCallback, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { FileText, Upload, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useWorkspace } from "@/hooks/use-workspace";
import { createCaseFromUpload } from "@/lib/uploads.functions";

const MAX_FILE_BYTES = 25 * 1024 * 1024;

type Stage = "idle" | "uploading" | "extracting" | "filling" | "done" | "error";

const STAGE_COPY: Record<
  Exclude<Stage, "idle" | "done" | "error">,
  { title: string; subtitle: string }
> = {
  uploading: {
    title: "Uploading memorandum",
    subtitle: "Saving the PDF to storage.",
  },
  extracting: {
    title: "Extracting content",
    subtitle: "Reading the document.",
  },
  filling: {
    title: "Filling case fields",
    subtitle: "Pulling out highlights, profile, financials and decisions.",
  },
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadMemorandumDialog({
  triggerClassName,
}: {
  triggerClassName?: string;
}) {
  const { juniorId } = useWorkspace();
  const queryClient = useQueryClient();
  const router = useRouter();
  const createFn = useServerFn(createCaseFromUpload);

  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const reset = useCallback(() => {
    setFile(null);
    setStage("idle");
    setError(null);
    setDragOver(false);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (stage === "uploading" || stage === "extracting" || stage === "filling") {
        return;
      }
      setOpen(next);
      if (!next) reset();
    },
    [stage, reset],
  );

  const validateAndSet = useCallback((picked: File | null) => {
    setError(null);
    if (!picked) {
      setFile(null);
      return;
    }
    if (
      picked.type !== "application/pdf" &&
      !picked.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("PDF only. Try exporting your memorandum as PDF first.");
      return;
    }
    if (picked.size > MAX_FILE_BYTES) {
      setError("PDF is over 25 MB. Trim it down and try again.");
      return;
    }
    setFile(picked);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!file) return;
    setError(null);
    setStage("uploading");
    const fd = new FormData();
    fd.append("file", file, file.name);
    fd.append("juniorId", juniorId);
    try {
      setStage("extracting");
      // Both extraction stages happen server-side in one call; we flip
      // the UI label after a short beat so the user sees forward motion.
      const fillingTimer = window.setTimeout(() => setStage("filling"), 1800);
      const result = await createFn({ data: fd });
      window.clearTimeout(fillingTimer);
      setStage("done");
      await queryClient.invalidateQueries({ queryKey: ["cases", juniorId] });
      setOpen(false);
      reset();
      router.navigate({
        to: "/cases/$caseId",
        params: { caseId: result.id },
      });
    } catch (e) {
      setStage("error");
      setError((e as Error).message ?? "Something went wrong.");
    }
  }, [file, juniorId, createFn, queryClient, router, reset]);

  const busy =
    stage === "uploading" || stage === "extracting" || stage === "filling";

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-[13px] font-bold uppercase tracking-[0.06em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50",
            triggerClassName,
          )}
        >
          <Upload className="h-4 w-4" />
          Upload memorandum
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-8 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
          onEscapeKeyDown={(e) => {
            if (busy) e.preventDefault();
          }}
          onPointerDownOutside={(e) => {
            if (busy) e.preventDefault();
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogPrimitive.Title className="text-[20px] font-bold text-foreground">
                Upload memorandum
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1 text-[13px] text-muted-foreground">
                Drop an IM / CIM / teaser as PDF. We'll create the case and
                pre-fill highlights, profile, financials and decisions.
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close
              className="rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              disabled={busy}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          <div className="mt-6">
            {busy ? (
              <ProgressBlock stage={stage as "uploading" | "extracting" | "filling"} fileName={file?.name ?? ""} />
            ) : (
              <>
                <label
                  htmlFor="memorandum-file"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const dropped = e.dataTransfer.files?.[0] ?? null;
                    validateAndSet(dropped);
                  }}
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-6 py-10 text-center transition-colors hover:bg-muted",
                    dragOver && "border-primary bg-muted",
                  )}
                >
                  <FileText className="h-6 w-6 text-muted-foreground" />
                  <div className="text-[14px] text-foreground">
                    {file ? file.name : "Choose a PDF or drop it here"}
                  </div>
                  <div className="text-[12px] text-muted-foreground">
                    {file
                      ? formatSize(file.size)
                      : "PDF only, up to 25 MB"}
                  </div>
                  <input
                    id="memorandum-file"
                    ref={inputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="sr-only"
                    onChange={(e) => validateAndSet(e.target.files?.[0] ?? null)}
                  />
                </label>

                {error && (
                  <p className="mt-3 text-[13px] text-danger">{error}</p>
                )}

                <div className="mt-6 flex items-center justify-end gap-3">
                  {file && (
                    <button
                      type="button"
                      onClick={reset}
                      className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Remove
                    </button>
                  )}
                  <DialogPrimitive.Close asChild>
                    <button
                      type="button"
                      className="inline-flex items-center rounded-md border border-border bg-card px-5 py-2.5 text-[13px] font-bold uppercase tracking-[0.06em] text-foreground transition-colors hover:bg-muted"
                    >
                      Cancel
                    </button>
                  </DialogPrimitive.Close>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!file}
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-[13px] font-bold uppercase tracking-[0.06em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    Create case
                  </button>
                </div>
              </>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function ProgressBlock({
  stage,
  fileName,
}: {
  stage: "uploading" | "extracting" | "filling";
  fileName: string;
}) {
  const copy = STAGE_COPY[stage];
  const order: Array<"uploading" | "extracting" | "filling"> = [
    "uploading",
    "extracting",
    "filling",
  ];
  const activeIdx = order.indexOf(stage);
  return (
    <div className="rounded-lg border border-border bg-muted/40 px-6 py-6">
      <div className="text-[14px] font-bold text-foreground">{copy.title}</div>
      <div className="mt-1 text-[13px] text-muted-foreground">
        {copy.subtitle}
      </div>
      {fileName && (
        <div className="mt-1 truncate font-mono text-[12px] text-muted-foreground">
          {fileName}
        </div>
      )}
      <ol className="mt-5 space-y-2">
        {order.map((s, i) => {
          const done = i < activeIdx;
          const active = i === activeIdx;
          return (
            <li
              key={s}
              className={cn(
                "flex items-center gap-3 text-[13px]",
                done && "text-muted-foreground",
                active && "text-foreground",
                !done && !active && "text-muted-foreground/60",
              )}
            >
              <span
                className={cn(
                  "inline-block h-1.5 w-1.5 rounded-full",
                  done && "bg-success",
                  active && "animate-pulse bg-primary",
                  !done && !active && "bg-border",
                )}
              />
              {STAGE_COPY[s].title}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
