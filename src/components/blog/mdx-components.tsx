import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { ProblemCard } from "./ProblemCard";

function MDXLink({ href, children, ...rest }: ComponentPropsWithoutRef<"a">) {
  const url = href ?? "";
  if (url.startsWith("/")) {
    return (
      <Link
        href={url}
        className="text-brand-cyan underline-offset-2 hover:underline font-medium"
      >
        {children}
      </Link>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand-cyan underline-offset-2 hover:underline font-medium"
      {...rest}
    >
      {children}
    </a>
  );
}

export const mdxComponents = {
  a: MDXLink,
  ProblemCard,
};
