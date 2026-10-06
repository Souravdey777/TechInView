"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A4 at 96dpi. Report pages are laid out at this fixed size and scaled to fit, like a PDF viewer. */
export const PAGE_W = 794;
export const PAGE_H = 1123;

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function ReportScaler({
  children,
  className,
  pageWidth = PAGE_W,
}: {
  children: ReactNode;
  className?: string;
  pageWidth?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / pageWidth)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [pageWidth]);

  return (
    <div ref={ref} className={className}>
      <div style={{ zoom: scale, width: pageWidth }}>{children}</div>
    </div>
  );
}

/** Pages side by side, snapping into place. Marks on a page draw in the first time it is centred. */
type ViewerPage = { node: ReactNode; width: number; height: number };

/** Display width that gives every page the same on-screen height as an A4 page shown at 560px. */
const itemWidth = (p: ViewerPage) => `min(${Math.round((560 * (p.width / p.height)) / (PAGE_W / PAGE_H))}px, 80vw)`;

export function ReportCarousel({ pages, fileName }: { pages: ViewerPage[]; fileName: string }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [seen, setSeen] = useState<ReadonlySet<number>>(new Set());

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.classList.add("rr-anim");
    const items = [...el.querySelectorAll<HTMLElement>("[data-page]")];
    // The page in focus is the one whose centre is nearest the strip's centre.
    // (A visibility threshold picks the wrong page when several fit on screen.)
    let raf = 0;
    const pick = () => {
      raf = 0;
      const mid = el.getBoundingClientRect().left + el.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      items.forEach((item, i) => {
        const r = item.getBoundingClientRect();
        const dist = Math.abs(r.left + r.width / 2 - mid);
        if (dist < bestDist) [best, bestDist] = [i, dist];
      });
      setActive(best);
      setSeen((prev) => (prev.has(best) ? prev : new Set(prev).add(best)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(pick);
    };
    // Marks on the first page draw in once the viewer itself scrolls into view.
    const io = new IntersectionObserver(([e]) => e.isIntersecting && pick(), { threshold: 0.3 });
    io.observe(el);
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      io.disconnect();
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const go = (i: number) => {
    const el = scroller.current?.querySelector<HTMLElement>(`[data-page="${Math.max(0, Math.min(pages.length - 1, i))}"]`);
    const sc = scroller.current;
    if (!el || !sc) return;
    // Scroll the strip only; scrollIntoView would also move the page vertically.
    sc.scrollTo({ left: el.offsetLeft - (sc.clientWidth - el.clientWidth) / 2, behavior: reducedMotion() ? "auto" : "smooth" });
  };

  return (
    <div className="overflow-hidden rounded-[20px] border border-white/[0.09] bg-brand-surface">
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.1em] text-brand-muted">
        <span className="truncate">{fileName}</span>
        <div className="flex flex-none items-center gap-3">
          <span aria-live="polite">
            Page {active + 1} / {pages.length}
          </span>
          {[
            { label: "Previous page", glyph: "←", to: active - 1, off: active === 0 },
            { label: "Next page", glyph: "→", to: active + 1, off: active === pages.length - 1 },
          ].map((b) => (
            <button
              key={b.label}
              type="button"
              aria-label={b.label}
              disabled={b.off}
              onClick={() => go(b.to)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.14] text-brand-text transition-colors hover:border-brand-cyan hover:text-brand-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan disabled:opacity-30"
            >
              {b.glyph}
            </button>
          ))}
        </div>
      </div>
      <div
        ref={scroller}
        tabIndex={0}
        aria-label={`Sample report, ${pages.length} pages. Scroll sideways or use the arrow keys.`}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto overscroll-x-contain bg-[#1A1C20] px-[calc(50%-min(280px,40vw))] py-8 [scrollbar-width:thin] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-cyan sm:py-10"
      >
        {pages.map((page, i) => (
          <div
            key={i}
            data-page={i}
            className={cn(
              "rr-page flex-none snap-center self-center transition-[transform,opacity] duration-500 ease-out",
              seen.has(i) && "rr-inview",
              i === active ? "scale-100 opacity-100" : "scale-[0.94] opacity-50"
            )}
            style={{ width: itemWidth(page) }}
          >
            <ReportScaler pageWidth={page.width} className="overflow-hidden rounded-[4px] shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
              {page.node}
            </ReportScaler>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-2 border-t border-white/[0.08] py-3">
        {pages.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to page ${i + 1}`}
            aria-current={i === active}
            onClick={() => go(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan",
              i === active ? "w-6 bg-brand-cyan" : "w-1.5 bg-white/25 hover:bg-white/50"
            )}
          />
        ))}
      </div>
    </div>
  );
}

/** Three report pages fanned in a stack that tilts toward the pointer, with a scan line over the front page. */
export function HeroStack({ front, back }: { front: ReactNode; back: [ReactNode, ReactNode] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    const onMove = (e: PointerEvent) => {
      el.style.setProperty("--mx", String(e.clientX / window.innerWidth - 0.5));
      el.style.setProperty("--my", String(e.clientY / window.innerHeight - 0.5));
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const layer = (depth: number, base: string): CSSProperties => ({
    transform: `${base} translate(calc(var(--mx, 0) * ${depth}px), calc(var(--my, 0) * ${depth}px))`,
    transition: "transform 0.4s cubic-bezier(0.2, 0.7, 0.2, 1)",
  });

  return (
    <div ref={ref} className="rr-float relative mx-auto aspect-[794/1123] w-full max-w-[420px]" aria-hidden>
      <div className="absolute inset-0" style={layer(-14, "rotate(-8deg) translate(-16%, 5%) scale(0.88)")}>
        <ReportScaler className="overflow-hidden rounded-[6px] opacity-60 shadow-[0_30px_80px_rgba(0,0,0,0.5)]">{back[0]}</ReportScaler>
      </div>
      <div className="absolute inset-0" style={layer(-24, "rotate(7deg) translate(15%, 7%) scale(0.9)")}>
        <ReportScaler className="overflow-hidden rounded-[6px] opacity-75 shadow-[0_30px_80px_rgba(0,0,0,0.5)]">{back[1]}</ReportScaler>
      </div>
      <div className="relative" style={layer(36, "rotate(1.5deg)")}>
        <ReportScaler className="relative overflow-hidden rounded-[6px] shadow-[0_40px_100px_rgba(0,0,0,0.55)]">{front}</ReportScaler>
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[6px]">
          <div className="rr-scan absolute inset-x-0 h-16 -translate-y-full bg-gradient-to-b from-transparent to-[#22D3EE]/25">
            <div className="absolute inset-x-0 bottom-0 h-px bg-[#22D3EE] shadow-[0_0_12px_#22D3EE]" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Renders the final value on the server, then counts up from zero once it scrolls into view. */
export function CountUp({ to, decimals = 0 }: { to: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    el.textContent = (0).toFixed(decimals);
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / 1400);
        el.textContent = (to * (1 - Math.pow(1 - t, 3))).toFixed(decimals);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, decimals]);

  return <span ref={ref}>{to.toFixed(decimals)}</span>;
}

/**
 * Margin notes for a marked-up page, placed like the skill's markup.py: each note
 * level with its anchor ([data-anchor] inside the page), pushed down when the one
 * above would collide. Notes must be listed top to bottom. Also staggers the pen
 * marks' draw-in delay in document order.
 */
export function MarginNotes({
  notes,
  sheetWidth,
  left,
  className,
}: {
  notes: { at: string; text: string }[];
  sheetWidth: number;
  left: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tops, setTops] = useState<number[] | null>(null);

  useLayoutEffect(() => {
    const box = ref.current;
    const root = box?.parentElement;
    const sheet = root?.querySelector<HTMLElement>("[data-sheet]");
    if (!box || !root || !sheet) return;

    root.querySelectorAll<HTMLElement | SVGElement>("[data-mark]").forEach((el, i) => el.style.setProperty("--d", `${i * 60}ms`));

    const place = () => {
      const sr = sheet.getBoundingClientRect();
      if (!sr.width) return;
      const k = sr.width / sheetWidth; // CSS zoom of the page
      const els = [...box.children] as HTMLElement[];
      let cursor = 0;
      setTops(
        notes.map((n, i) => {
          const anchor = root.querySelector(`[data-anchor="${n.at}"]`);
          const y = anchor ? (anchor.getBoundingClientRect().top - sr.top) / k : cursor;
          const top = Math.max(y - 2, cursor);
          cursor = top + els[i].getBoundingClientRect().height / k + 6;
          return top;
        })
      );
    };

    place();
    document.fonts?.ready.then(place);
    const ro = new ResizeObserver(place);
    ro.observe(sheet);
    return () => ro.disconnect();
  }, [notes, sheetWidth]);

  return (
    <div ref={ref} className="absolute inset-y-0 right-0" style={{ left }}>
      {notes.map((n, i) => (
        <div
          key={n.at}
          style={{ top: tops?.[i] ?? i * 64, "--d": `${i * 90}ms` } as CSSProperties}
          className={cn("rr-note absolute inset-x-0", className)}
        >
          {n.text}
        </div>
      ))}
    </div>
  );
}
