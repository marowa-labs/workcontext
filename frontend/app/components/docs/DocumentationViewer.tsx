"use client";

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import rehypeHighlight from "rehype-highlight";

interface DocumentationViewerProps {
  content: string;
  className?: string;
}

const DocumentationViewer: React.FC<DocumentationViewerProps> = ({
  content,
  className = "",
}) => {
  // Plan styling removed as per blueprint alignment
  const planDocContentClasses = "";
  const planDocHeadingClasses = "";
  const planDocLinkClasses = "";
  const planDocCodeClasses = "";

  const markdownComponents = useMemo(
    () => ({
      h1: ({ node, ...props }: any) => (
        <h1
          className={`text-3xl font-bold mb-6 mt-8 ${planDocHeadingClasses}`}
          {...props}
        />
      ),
      h2: ({ node, ...props }: any) => (
        <h2
          className={`text-2xl font-bold mb-5 mt-7 ${planDocHeadingClasses}`}
          {...props}
        />
      ),
      h3: ({ node, ...props }: any) => (
        <h3
          className={`text-xl font-bold mb-4 mt-6 ${planDocHeadingClasses}`}
          {...props}
        />
      ),
      h4: ({ node, ...props }: any) => (
        <h4
          className={`text-lg font-bold mb-3 mt-5 ${planDocHeadingClasses}`}
          {...props}
        />
      ),
      h5: ({ node, ...props }: any) => (
        <h5
          className={`text-base font-bold mb-2 mt-4 ${planDocHeadingClasses}`}
          {...props}
        />
      ),
      h6: ({ node, ...props }: any) => (
        <h6
          className={`text-sm font-bold mb-2 mt-3 ${planDocHeadingClasses}`}
          {...props}
        />
      ),
      p: ({ node, ...props }: any) => (
        <p className="mb-4 leading-relaxed" {...props} />
      ),
      a: ({ node, ...props }: any) => (
        <a
          className={`underline font-medium ${planDocLinkClasses}`}
          {...props}
        />
      ),
      ul: ({ node, ...props }: any) => (
        <ul className="list-disc list-inside mb-4 space-y-1" {...props} />
      ),
      ol: ({ node, ...props }: any) => (
        <ol className="list-decimal list-inside mb-4 space-y-1" {...props} />
      ),
      li: ({ node, ...props }: any) => <li className="ml-4" {...props} />,
      blockquote: ({ node, ...props }: any) => (
        <blockquote
          className="border-l-4 border-white pl-4 py-2 my-4 italic text-black dark:text-black"
          {...props}
        />
      ),
      code: ({ node, inline, ...props }: any) => {
        if (inline) {
          return (
            <code
              className={`font-mono text-sm px-1.5 py-0.5 rounded ${planDocCodeClasses}`}
              {...props}
            />
          );
        }
        return (
          <code
            className={`block font-mono text-sm p-4 rounded-lg mb-4 overflow-x-auto ${planDocCodeClasses}`}
            {...props}
          />
        );
      },
      pre: ({ node, ...props }: any) => <pre className="mb-4" {...props} />,
      table: ({ node, ...props }: any) => (
        <table
          className="min-w-full border-collapse border border-white mb-4"
          {...props}
        />
      ),
      th: ({ node, ...props }: any) => (
        <th
          className="border border-white px-4 py-2 bg-gray-100 dark:bg-white font-bold"
          {...props}
        />
      ),
      td: ({ node, ...props }: any) => (
        <td className="border border-white px-4 py-2" {...props} />
      ),
      hr: ({ node, ...props }: any) => (
        <hr className="my-6 border-white border-white" {...props} />
      ),
    }),
    [planDocHeadingClasses, planDocLinkClasses, planDocCodeClasses],
  );

  return (
    <div className={`prose max-w-none ${planDocContentClasses} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default DocumentationViewer;
