import { BrandLogo } from "@/components/shared/BrandLogo";

export function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-brand-border bg-brand-deep">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <BrandLogo size="sm" wordmarkClassName="text-base font-bold" />
        <p className="text-brand-muted text-sm">
          &copy; {new Date().getFullYear()} TechInView. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
