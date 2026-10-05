import { ArrowRight, Clock3, Sparkles } from "lucide-react";
import {
  InterviewSetupAsideCard,
  InterviewSetupHero,
  InterviewSetupLayout,
  InterviewSetupSection,
  type InterviewSetupStatus,
} from "@/components/interviews/InterviewSetupLayout";
import { BODY, ButtonLink, CHIP } from "@/components/marketing/ds";
import { cn } from "@/lib/utils";

type SetupPageShellProps = {
  title: string;
  status: InterviewSetupStatus;
  description: string;
  setupHighlights: string[];
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  contextLabel?: string | null;
};

export function SetupPageShell({
  title,
  status,
  description,
  setupHighlights,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  contextLabel,
}: SetupPageShellProps) {
  return (
    <InterviewSetupLayout
      containerClassName="max-w-4xl"
      supportingText={contextLabel ?? `${title} · Interview setup`}
      aside={
        <InterviewSetupAsideCard title="Availability" icon={<Clock3 className="h-3.5 w-3.5" />}>
          <p className={cn(BODY, "mt-3")}>
            {status === "live"
              ? "This interview is available now and follows the same setup-to-results flow as every other live round."
              : "This interview format is visible in the shared setup experience while its dedicated runtime is being built."}
          </p>
        </InterviewSetupAsideCard>
      }
    >
      <InterviewSetupHero
        title={title}
        status={status}
        description={description}
        metadata={setupHighlights}
        contextLabel={contextLabel}
      />

      <div className="mt-10">
        <InterviewSetupSection
          title="Interview format"
          icon={<Sparkles className="h-3.5 w-3.5" />}
          description="Every TechInView interview uses a familiar setup, session, and results structure while keeping the controls specific to this round."
        >
          <div className="mt-4 flex flex-wrap gap-2">
            {setupHighlights.map((item) => (
              <span key={`${title}-format-${item}`} className={CHIP}>
                {item}
              </span>
            ))}
          </div>
        </InterviewSetupSection>
      </div>

      <div className="mt-8 flex flex-wrap gap-3 border-t border-white/[0.08] pt-8">
        <ButtonLink href={primaryHref}>
          {primaryLabel}
          <ArrowRight className="h-4 w-4" />
        </ButtonLink>
        {secondaryHref && secondaryLabel ? (
          <ButtonLink href={secondaryHref} variant="ghost">
            {secondaryLabel}
          </ButtonLink>
        ) : null}
      </div>
    </InterviewSetupLayout>
  );
}
