import React, { Children, isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function getTextContent(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (!node) {
    return "";
  }

  if (Array.isArray(node)) {
    return node.map((child) => getTextContent(child)).join("");
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getTextContent(node.props.children);
  }

  return "";
}

export function slugifyMarkdownHeading(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[`*_~()[\]{}<>]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function MarkdownContent({ content }: { content: string }) {
  const headingSlugCounts = new Map<string, number>();

  function createHeading(level: 1 | 2 | 3 | 4) {
    return function Heading({ children }: { children?: ReactNode }) {
      const text = Children.toArray(children)
        .map((child) => getTextContent(child))
        .join("")
        .trim();
      const baseSlug = slugifyMarkdownHeading(text) || `section-${headingSlugCounts.size + 1}`;
      const currentCount = headingSlugCounts.get(baseSlug) ?? 0;
      const nextCount = currentCount + 1;
      headingSlugCounts.set(baseSlug, nextCount);
      const id = nextCount > 1 ? `${baseSlug}-${nextCount}` : baseSlug;

      return React.createElement(`h${level}`, { id }, children);
    };
  }

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: createHeading(1),
          h2: createHeading(2),
          h3: createHeading(3),
          h4: createHeading(4),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
