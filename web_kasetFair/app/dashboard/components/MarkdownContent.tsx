import React from "react";

type MarkdownContentProps = { markdown: string };

export function MarkdownContent({ markdown }: MarkdownContentProps) {
  const lines = markdown.split("\n");
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];

  const flushList = () => {
    if (!list.length) return;
    blocks.push(
      <ul
        key={`list-${blocks.length}`}
        className="mb-3 ml-4 list-disc space-y-1 text-sm leading-6 text-slate-700"
      >
        {list.map((item, idx) => (
          <li key={idx}>{parseInline(item)}</li>
        ))}
      </ul>,
    );
    list = [];
  };

  lines.forEach((line, idx) => {
    if (!line.trim()) {
      flushList();
      return;
    }
    if (line.startsWith("### ")) {
      flushList();
      blocks.push(
        <h3 key={`h3-${idx}`} className="mb-2 text-base font-semibold text-slate-900">
          {line.replace("### ", "")}
        </h3>,
      );
      return;
    }
    if (line.startsWith("## ")) {
      flushList();
      blocks.push(
        <h2 key={`h2-${idx}`} className="mb-3 text-lg font-semibold text-slate-900">
          {line.replace("## ", "")}
        </h2>,
      );
      return;
    }
    if (line.startsWith("- ")) {
      list.push(line.replace("- ", ""));
      return;
    }
    flushList();
    blocks.push(
      <p key={`p-${idx}`} className="mb-3 text-sm leading-6 text-slate-700">
        {parseInline(line)}
      </p>,
    );
  });

  flushList();
  return <>{blocks}</>;
}

function parseInline(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="text-slate-900">
          {part.replace(/\*\*/g, "")}
        </strong>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}
