import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create your account | TechInView",
  description: "Create a free TechInView account: DSA practice plus a free 5-minute AI voice interview.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
