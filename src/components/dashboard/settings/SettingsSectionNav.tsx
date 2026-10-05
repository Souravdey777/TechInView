"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type SettingsSection = {
  id: string;
  label: string;
  tone?: "default" | "danger";
};

type SettingsSectionNavProps = {
  sections: readonly SettingsSection[];
};

/**
 * Rail of section links for the settings page. The active item follows the
 * section closest to the top of the viewport.
 */
export function SettingsSectionNav({ sections }: SettingsSectionNavProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const targets = sections
      .map(({ id }) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          );

        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-72px 0px -55% 0px", threshold: 0 }
    );

    targets.forEach((target) => observer.observe(target));

    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav
      aria-label="Settings sections"
      className="flex overflow-x-auto lg:sticky lg:top-20 lg:flex-col lg:overflow-visible lg:border-l lg:border-white/[0.08]"
    >
      {sections.map(({ id, label, tone = "default" }) => {
        const isActive = activeId === id;
        const isDanger = tone === "danger";

        return (
          <a
            key={id}
            href={`#${id}`}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "flex h-11 shrink-0 items-center whitespace-nowrap border-b px-4 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-cyan",
              "lg:-ml-px lg:border-b-0 lg:border-l",
              isActive
                ? "border-brand-cyan text-brand-cyan"
                : "border-transparent text-brand-subtle hover:text-brand-text",
              isDanger && !isActive && "text-brand-rose/70 hover:text-brand-rose",
              isDanger && isActive && "border-brand-rose text-brand-rose"
            )}
          >
            {label}
          </a>
        );
      })}
    </nav>
  );
}
