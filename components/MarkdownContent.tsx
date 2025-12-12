"use client";

import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import MentionHighlight from "./MentionHighlight";

interface MarkdownContentProps {
  content: string;
  className?: string;
  onMentionClick?: (username: string) => void;
}

export default function MarkdownContent({
  content,
  className = "text-gray-200 mt-1 text-sm leading-relaxed",
  onMentionClick,
}: MarkdownContentProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        components={{
          // Style markdown elements with Tailwind classes
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl font-bold mt-4 mb-2 text-white" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl font-bold mt-3 mb-2 text-white" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-bold mt-2 mb-1 text-white" {...props} />
          ),
          p: ({ node, children, ...props }: any) => (
            <p className="mb-2">
              <MentionHighlight text={String(children)} onMentionClick={onMentionClick} />
            </p>
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-white" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-gray-300" {...props} />
          ),
          code: ((props: any) => {
            const { inline, className: codeClassName, children, ...rest } = props;
            const match = /language-(\w+)/.exec(codeClassName || "");
            const language = match ? match[1] : "text";
            
            if (inline) {
              return (
                <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono text-xs" {...rest}>
                  {children}
                </code>
              );
            }

            return (
              <SyntaxHighlighter
                language={language}
                style={oneDark as any}
                className="rounded my-2 text-xs"
                customStyle={{
                  padding: "12px",
                  margin: "8px 0",
                  backgroundColor: "#1e293b",
                }}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            );
          }),
          pre: ({ node, ...props }) => (
            <pre className="bg-slate-800 p-3 rounded my-2 overflow-x-auto" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-purple-500 pl-4 italic text-gray-300 my-2"
              {...props}
            />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside ml-2 mb-2" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside ml-2 mb-2" {...props} />
          ),
          li: ({ node, ...props }) => <li className="mb-1" {...props} />,
          a: ({ node, ...props }) => (
            <a
              className="text-blue-400 hover:text-blue-300 underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-3 border-slate-700" {...props} />
          ),
          table: ({ node, ...props }) => (
            <table className="border-collapse border border-slate-700 my-2 text-sm" {...props} />
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-slate-800" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="border border-slate-700 px-3 py-2 font-bold text-left" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="border border-slate-700 px-3 py-2" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
