import { cn } from "@/lib/utils";

function Pulse({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-full bg-white/[0.04]", className)} />;
}

function PaneHeader() {
  return (
    <div className="flex h-11 shrink-0 items-center border-b border-white/[0.08] px-4">
      <Pulse className="h-2.5 w-20" />
    </div>
  );
}

function TextLines({ widths }: { widths: string[] }) {
  return (
    <div className="space-y-2.5">
      {widths.map((width, i) => (
        <Pulse key={i} className={cn("h-3", width)} />
      ))}
    </div>
  );
}

/**
 * Full-screen placeholder for the interview and practice rooms while their
 * client bundle loads. Mirrors the room chrome: hairline top bar, hairline
 * divided panes on brand-deep, and (for coding) the bottom control bar.
 * "coding" = problem | editor + tests | voice; "conversation" = stage | transcript.
 */
export function RoomSkeleton({
  variant = "coding",
  label = "Loading interview room",
}: {
  variant?: "coding" | "conversation";
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-label={label}
      className="fixed inset-0 flex flex-col overflow-hidden bg-brand-deep"
    >
      {/* Top bar */}
      <div className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-white/[0.08] px-4">
        <div className="flex items-center gap-3">
          <Pulse className="h-7 w-7 rounded-md" />
          <span className="h-4 w-px bg-white/[0.08]" aria-hidden />
          <Pulse className="h-2.5 w-40" />
        </div>
        <Pulse className="h-8 w-20" />
      </div>

      {variant === "coding" ? (
        <>
          <div className="flex flex-1 overflow-hidden">
            {/* Problem */}
            <div className="flex w-[400px] shrink-0 flex-col border-r border-white/[0.08]">
              <PaneHeader />
              <div className="space-y-8 p-5">
                <Pulse className="h-6 w-56" />
                <TextLines widths={["w-full", "w-11/12", "w-5/6", "w-2/3"]} />
                <TextLines widths={["w-1/3", "w-3/4", "w-1/2"]} />
              </div>
            </div>

            {/* Editor + tests */}
            <div className="flex flex-1 flex-col">
              <div className="flex-1 space-y-3 p-5">
                {["w-1/3", "w-1/2", "w-2/5", "w-3/5", "w-1/4", "w-1/2", "w-1/3"].map((width, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Pulse className="h-3 w-4" />
                    <Pulse className={cn("h-3", width)} />
                  </div>
                ))}
              </div>
              <div className="h-48 shrink-0 border-t border-white/[0.08]">
                <PaneHeader />
                <div className="p-4">
                  <TextLines widths={["w-1/2", "w-1/3"]} />
                </div>
              </div>
            </div>

            {/* Voice */}
            <div className="flex w-[300px] shrink-0 flex-col border-l border-white/[0.08] xl:w-[336px]">
              <div className="flex flex-col items-center gap-4 border-b border-white/[0.08] p-6">
                <div className="h-20 w-20 animate-pulse rounded-full bg-white/[0.04]" />
                <Pulse className="h-2.5 w-24" />
              </div>
              <div className="space-y-6 p-4">
                <TextLines widths={["w-16", "w-full", "w-4/5"]} />
                <TextLines widths={["w-12", "w-11/12", "w-3/5"]} />
              </div>
            </div>
          </div>

          {/* Control bar */}
          <div className="flex h-12 shrink-0 items-center justify-between border-t border-white/[0.08] px-4">
            <Pulse className="h-2.5 w-32" />
            <div className="flex gap-2">
              <Pulse className="h-8 w-16" />
              <Pulse className="h-8 w-20" />
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Stage */}
          <div className="flex flex-1 flex-col items-center justify-center gap-6 p-10">
            <div className="h-28 w-28 animate-pulse rounded-full bg-white/[0.04]" />
            <Pulse className="h-3 w-40" />
            <Pulse className="h-10 w-48" />
          </div>

          {/* Transcript */}
          <div className="hidden w-[360px] shrink-0 flex-col border-l border-white/[0.08] lg:flex">
            <PaneHeader />
            <div className="divide-y divide-white/[0.08]">
              {[0, 1, 2].map((i) => (
                <div key={i} className="p-4">
                  <TextLines widths={["w-14", "w-full", "w-4/5"]} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
