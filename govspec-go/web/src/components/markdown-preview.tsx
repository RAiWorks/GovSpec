import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

const components: Components = {
  pre: ({ children }) => (
    <pre className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 overflow-x-auto text-sm leading-relaxed my-4">{children}</pre>
  ),
  code: ({ children, className }) => {
    if (!className) {
      return <code className="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>;
    }
    return <code className="text-zinc-800 dark:text-zinc-200 font-mono text-sm whitespace-pre">{children}</code>;
  },
  table: ({ children }) => (
    <div className="overflow-x-auto my-4 border border-zinc-200 dark:border-zinc-700 rounded-lg">
      <table className="min-w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-zinc-50 dark:bg-zinc-800">{children}</thead>,
  th: ({ children }) => <th className="px-3 py-2 text-left font-semibold text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-700">{children}</th>,
  td: ({ children }) => <td className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">{children}</td>,
  hr: () => <hr className="my-6 border-zinc-200 dark:border-zinc-700" />,
  h1: ({ children }) => <h1 className="text-2xl font-bold border-b border-zinc-200 dark:border-zinc-700 pb-2 mt-8 mb-4 first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="text-xl font-semibold mt-8 mb-3 text-zinc-800 dark:text-zinc-200">{children}</h2>,
  h3: ({ children }) => <h3 className="text-lg font-semibold mt-6 mb-2 text-zinc-700 dark:text-zinc-300">{children}</h3>,
  p: ({ children }) => <p className="leading-7 my-2 text-zinc-700 dark:text-zinc-300">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-6 my-2 space-y-1 text-zinc-700 dark:text-zinc-300">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-6 my-2 space-y-1 text-zinc-700 dark:text-zinc-300">{children}</ol>,
  li: ({ children }) => <li className="leading-7">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{children}</strong>,
  blockquote: ({ children }) => <blockquote className="border-l-4 border-zinc-300 dark:border-zinc-600 pl-4 my-4 text-zinc-600 dark:text-zinc-400 italic">{children}</blockquote>,
};

export function MarkdownPreview({ content }: { content: string }) {
  return (
    <article className="max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{content}</ReactMarkdown>
    </article>
  );
}
