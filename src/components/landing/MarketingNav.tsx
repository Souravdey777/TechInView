import Link from "next/link";

type MarketingNavProps = {
  signupHref?: string;
};

export function MarketingNav({ signupHref = "/login" }: MarketingNavProps) {
  return (
    <header className="sticky top-0 z-50 bg-brand-deep/80 backdrop-blur-md border-b border-brand-border">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1">
          <span className="text-xl font-bold font-heading text-brand-text tracking-tight">
            TechInView
          </span>
          <span className="text-brand-cyan text-2xl leading-none">.</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/#features"
            className="text-sm text-brand-muted hover:text-brand-text transition-colors"
          >
            Features
          </Link>
          <Link
            href="/#how-it-works"
            className="text-sm text-brand-muted hover:text-brand-text transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="/#pricing"
            className="text-sm text-brand-muted hover:text-brand-text transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/#faq"
            className="text-sm text-brand-muted hover:text-brand-text transition-colors"
          >
            FAQ
          </Link>
          <Link
            href="/blog"
            className="text-sm text-brand-muted hover:text-brand-text transition-colors"
          >
            Blog
          </Link>
        </div>
        <Link
          href={signupHref}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-brand-cyan text-brand-deep text-sm font-semibold hover:bg-cyan-300 transition-colors"
        >
          Get Started
        </Link>
      </nav>
    </header>
  );
}
