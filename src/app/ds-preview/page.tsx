import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DesignSystemPage from "../(app)/design-system/page";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Dev-only: the /design-system page without the logged-in app shell or auth gate. */
export default function DesignSystemPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="min-h-screen bg-brand-deep px-4 py-8 sm:px-6">
      <DesignSystemPage />
    </div>
  );
}
