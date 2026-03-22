import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-deep flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-brand-cyan text-sm font-semibold uppercase tracking-widest mb-4">
          404
        </p>
        <h1 className="text-4xl font-bold text-brand-text mb-4">
          Page not found
        </h1>
        <p className="text-brand-muted mb-8 max-w-sm mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-brand-cyan text-brand-deep font-semibold hover:bg-cyan-300 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
