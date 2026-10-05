import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in | TechInView",
  description: "Log in to TechInView to continue your AI mock interview practice.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
