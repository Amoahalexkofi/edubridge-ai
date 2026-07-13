"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

export default function LessonContent({ content }: { content: string }) {
  return (
    <div className="prose prose-slate max-w-none lesson-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => (
            <h2 className="text-lg font-bold text-[#0f172a] mt-6 mb-2 first:mt-0">{children}</h2>
          ),
          h2: ({ children }) => (
            <h3 className="text-base font-bold text-[#334155] mt-5 mb-1.5">{children}</h3>
          ),
          h3: ({ children }) => (
            <h4 className="text-sm font-bold text-[#475569] mt-4 mb-1">{children}</h4>
          ),
          p: ({ children }) => (
            <p className="text-[#334155] text-sm leading-relaxed mb-3">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 space-y-1.5 mb-3">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 space-y-1.5 mb-3">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-[#334155] text-sm leading-relaxed">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-[#0f172a]">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-[#475569]">{children}</em>
          ),
          blockquote: ({ children }) => (
            <blockquote className="px-4 py-3 bg-[#EFF6FF] rounded-xl my-4 text-sm text-[#334155] italic">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <pre className="bg-[#F8F7F4] border border-[#E6E4DE] rounded-xl p-4 overflow-x-auto text-xs font-mono text-[#334155] my-4">
                  <code>{children}</code>
                </pre>
              );
            }
            return (
              <code className="bg-[#F2F1EE] text-[#1D4ED8] text-xs font-mono px-1.5 py-0.5 rounded">
                {children}
              </code>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="w-full text-sm border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="bg-[#F2F1EE] text-[#0f172a] font-bold px-4 py-2 border border-[#E6E4DE] text-left">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 border border-[#E6E4DE] text-[#334155]">{children}</td>
          ),
          hr: () => <hr className="border-[#E6E4DE] my-6" />,
          img: ({ src, alt }) =>
            typeof src === "string" ? (
              <figure className="my-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={alt ?? ""}
                  loading="lazy"
                  className="max-w-full h-auto rounded-xl border border-[#E6E4DE] mx-auto block"
                />
                {alt && <figcaption className="text-center text-xs text-[#94a3b8] mt-2">{alt}</figcaption>}
              </figure>
            ) : null,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
