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
      <Link href={url}>
        {children}
      </Link>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
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

/** Wide tables scroll inside the column instead of the page on mobile. */
function MDXTable(props: ComponentPropsWithoutRef<"table">) {
  return (
    <div className="my-8 overflow-x-auto border-y border-white/[0.08]">
      <table {...props} className="my-0" />
    </div>
  );
}

export const mdxComponents = {
  table: MDXTable,
  a: MDXLink,
  h2: MDXHeading2,
  h3: MDXHeading3,
  ProblemCard,
};
