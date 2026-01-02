import React, { useState, useEffect } from 'react';
import { Save, Trash2, Split, Merge, CheckCircle, AlertCircle } from 'lucide-react';
import { segmentQuestions } from '../../lib/segmentation';
import { createPortal } from 'react-dom';

export function ReviewInterface({ rawText, initialBlocks, onSave }) {
    const [blocks, setBlocks] = useState([]);

    useEffect(() => {
        if (initialBlocks && initialBlocks.length > 0) {
            setBlocks(initialSegments => initialBlocks.map(b => ({
                id: crypto.randomUUID(),
                text: b.text || b
            })));
        } else if (rawText) {
            const initialSegments = segmentQuestions(rawText);
            setBlocks(initialSegments.map(text => ({
                id: crypto.randomUUID(),
                text: text
            })));
        }
    }, [rawText, initialBlocks]);

    const updateBlock = (id, newText) => {
        setBlocks(blocks.map(b => b.id === id ? { ...b, text: newText } : b));
    };

    const deleteBlock = (id) => {
        setBlocks(blocks.filter(b => b.id !== id));
    };

    const mergeUp = (index) => {
        if (index === 0) return;
        const current = blocks[index];
        const prev = blocks[index - 1];
        const merged = { ...prev, text: prev.text + '\n' + current.text };
        const newBlocks = [...blocks];
        newBlocks.splice(index - 1, 2, merged);
        setBlocks(newBlocks);
    };

    const splitBlock = (index) => {
        const newBlock = { id: crypto.randomUUID(), text: '' };
        const newBlocks = [...blocks];
        newBlocks.splice(index + 1, 0, newBlock);
        setBlocks(newBlocks);
    };

    return (
        <>
            <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-b border-white/10 mb-2">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            Review Questions
                        </h2>
                        <p className="text-zinc-400 text-sm mt-1">
                            We found <span className="text-indigo-400 font-bold">{blocks.length}</span> questions. Edit them below if needed.
                        </p>
                    </div>

                    <div className="hidden md:block">
                        <button
                            onClick={() => onSave(blocks)}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <Save size={18} /> Save All
                        </button>
                    </div>
                </div>

                <div className="space-y-4 pb-24">
                    {blocks.map((block, index) => (
                        <div key={block.id} className="group relative bg-zinc-900/40 backdrop-blur-sm border border-white/5 rounded-2xl p-1 hover:border-indigo-500/30 transition-all duration-300">
                            <div className="absolute top-6 left-6 text-xs font-bold text-indigo-500 select-none bg-indigo-500/10 px-2 py-1 rounded">
                                Q{index + 1}
                            </div>

                            <div className="p-5 pl-16">
                                <textarea
                                    className="w-full bg-transparent text-zinc-100 text-lg leading-relaxed resize-y min-h-[120px] outline-none placeholder:text-zinc-700 font-medium rounded-lg selection:bg-indigo-500/30"
                                    value={block.text}
                                    onChange={(e) => updateBlock(block.id, e.target.value)}
                                    placeholder="Type question content here..."
                                />
                            </div>

                            {/* Hover Tools */}
                            <div className="flex items-center gap-2 px-4 pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent mr-4" />

                                {index > 0 && (
                                    <button
                                        className="p-2 text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                                        onClick={() => mergeUp(index)}
                                        title="Merge with question above"
                                    >
                                        <Merge size={16} className="-rotate-90" />
                                    </button>
                                )}

                                <button
                                    className="p-2 text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                                    onClick={() => splitBlock(index)}
                                    title="Split into new question below"
                                >
                                    <Split size={16} />
                                </button>

                                <div className="w-px h-4 bg-white/10 mx-1" />

                                <button
                                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    onClick={() => deleteBlock(block.id)}
                                    title="Delete question"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Sticky Action Portal */}
            {typeof document !== 'undefined' && createPortal(
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999]">
                    <button
                        onClick={() => onSave(blocks)}
                        className="px-6 py-3 bg-zinc-900/60 backdrop-blur-md border border-white/5 text-white font-semibold text-base rounded-full shadow-xl active:scale-95 transition-all flex items-center gap-2 hover:bg-zinc-800/80 hover:border-indigo-500/30 group"
                    >
                        <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <CheckCircle size={14} fill="currentColor" className="text-white" />
                        </span>
                        Save {blocks.length} Questions
                    </button>
                </div>,
                document.body
            )}
        </>
    );
}
