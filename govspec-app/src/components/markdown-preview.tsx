"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownPreview({ content }: { content: string }) {
  return (
    <article className="prose prose-zinc dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-h1:text-2xl prose-h1:font-bold prose-h1:border-b prose-h1:pb-2 prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-3 prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-2 prose-p:leading-7 prose-li:leading-7 prose-table:text-sm prose-th:bg-zinc-100 dark:prose-th:bg-zinc-800 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-td:px-3 prose-td:py-2 prose-td:border-t prose-code:bg-zinc-100 dark:prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-hr:my-6 prose-strong:font-semibold">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </article>
  );
}
