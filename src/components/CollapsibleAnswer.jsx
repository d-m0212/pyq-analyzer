import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// Pre-process content to replace \[ \] and \( \) with $$ $$ and $ $ for remark-math
const preprocessLaTeX = (content) => {
    if (typeof content !== 'string') return content;
    return content
        .replace(/\\\[([\s\S]*?)\\\]/g, '$$$1$$') // Replace \[ ... \] with $$ ... $$
        .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$'); // Replace \( ... \) with $ ... $
};

export function CollapsibleAnswer({ content, isOpen, onToggle }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const isLong = content.length > 300; // Threshold for collapsing

    if (!content) return null;

    return (
        <div className="mt-3 p-4 bg-zinc-950/50 rounded-lg border border-zinc-800/50 text-zinc-300 text-sm leading-relaxed animate-in fade-in">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                    <Bot size={12} /> AI Answer
                </div>
                {isLong && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                        {isExpanded ? (
                            <>Collapse <ChevronUp size={12} /></>
                        ) : (
                            <>Expand <ChevronDown size={12} /></>
                        )}
                    </button>
                )}
            </div>

            <div className={`prose prose-invert prose-sm max-w-none ${!isExpanded && isLong ? 'line-clamp-3 opacity-80' : ''}`}>
                <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                >
                    {preprocessLaTeX(content)}
                </ReactMarkdown>
            </div>

            {!isExpanded && isLong && (
                <button
                    onClick={() => setIsExpanded(true)}
                    className="w-full mt-2 pt-2 border-t border-zinc-800/50 text-xs text-zinc-500 hover:text-emerald-400 transition-colors flex items-center justify-center gap-1"
                >
                    Show Full Solution <ChevronDown size={12} />
                </button>
            )}
        </div>
    );
}
