import Link from "next/link";
import {
  Children,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { slugifyHeading } from "@/lib/blog-taxonomy";
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

/** Flattens heading children to plain text so the id matches the TOC. */
function childrenToText(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }
      if (isValidElement<{ children?: ReactNode }>(child)) {
        return childrenToText(child.props.children);
      }
      return "";
    })
    .join("");
}

function MDXHeading2({ children, ...rest }: ComponentPropsWithoutRef<"h2">) {
  return (
    <h2 id={slugifyHeading(childrenToText(children))} {...rest}>
      {children}
    </h2>
  );
}

function MDXHeading3({ children, ...rest }: ComponentPropsWithoutRef<"h3">) {
  return (
    <h3 id={slugifyHeading(childrenToText(children))} {...rest}>
      {children}
    </h3>
  );
}

export const mdxComponents = {
  a: MDXLink,
  h2: MDXHeading2,
  h3: MDXHeading3,
  ProblemCard,
};
