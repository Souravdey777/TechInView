export function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-brand-border bg-brand-deep">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          <span className="font-bold font-heading text-brand-text tracking-tight">
            TechInView
          </span>
          <span className="text-brand-cyan text-xl leading-none">.</span>
        </div>
        <p className="text-brand-muted text-sm">
          &copy; {new Date().getFullYear()} TechInView. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
