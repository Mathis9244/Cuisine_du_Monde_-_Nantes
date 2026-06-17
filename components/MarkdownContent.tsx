"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

const baseClassName = "prose prose-invert max-w-none";

const MarkdownContent: React.FC<MarkdownContentProps> = ({
  content,
  className,
}) => {
  return (
    <div className={`${baseClassName} ${className || ""}`.trim()}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="my-0 text-sm leading-relaxed text-circle-frost/90">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-black text-circle-text">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-circle-text">{children}</em>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-black text-circle-amber underline decoration-circle-amber/50 underline-offset-4 hover:decoration-circle-amber"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="my-0 pl-5 text-sm leading-relaxed text-circle-frost/90 list-disc space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-0 pl-5 text-sm leading-relaxed text-circle-frost/90 list-decimal space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="marker:text-circle-amber">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-0 border-l-2 border-circle-amber/50 pl-4 text-circle-frost/70 italic">
              {children}
            </blockquote>
          ),
          code: (props: any) =>
            props.inline ? (
              <code className="rounded bg-circle-bg/80 px-1.5 py-0.5 text-[0.85em] font-black text-circle-amber">
                {props.children}
              </code>
            ) : (
              <code className="block overflow-x-auto rounded-2xl border border-circle-border bg-circle-bg/80 p-4 text-xs text-circle-frost/80">
                {props.children}
              </code>
            ),
          h1: ({ children }) => (
            <h1 className="my-0 text-xl font-black uppercase tracking-tight text-circle-text">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="my-0 text-lg font-black uppercase tracking-tight text-circle-text">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="my-0 text-base font-black uppercase tracking-tight text-circle-text">
              {children}
            </h3>
          ),
          hr: () => <hr className="my-0 border-circle-border/70" />,
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm text-circle-frost/90">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-circle-border bg-circle-bg/70 px-3 py-2 text-left font-black text-circle-text">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-circle-border px-3 py-2 align-top">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent;
