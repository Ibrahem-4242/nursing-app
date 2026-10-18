'use client';

import React from 'react';
import { createHighlightRegex } from '@/lib/search-engine';

interface HighlightTextProps {
  text: string;
  query: string;
  className?: string;
}

export default function HighlightText({ text, query, className = '' }: HighlightTextProps) {
  if (!text) return null;
  if (!query || !query.trim()) {
    return <span className={className}>{text}</span>;
  }

  const regex = createHighlightRegex(query);
  if (!regex) {
    return <span className={className}>{text}</span>;
  }

  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Test if this part matches the regex
        if (regex.test(part)) {
          return (
            <mark
              key={index}
              className="bg-amber-200/95 dark:bg-amber-500/35 text-amber-950 dark:text-amber-200 font-extrabold px-1 py-0.5 rounded-md shadow-xs mx-0.5"
            >
              {part}
            </mark>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
}
