import React, { useState, useCallback } from 'react';
import { Upload as UploadIcon, FileText, X } from 'lucide-react';
import styles from './Upload.module.css';

export function FileUpload({ onFilesSelected }) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [year, setYear] = useState(new Date().getFullYear());
    const [session, setSession] = useState('Main');
    const [files, setFiles] = useState([]);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => setIsDragOver(false);

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        addFiles(droppedFiles);
    };

    // ... (logic methods are unchanged, just re-copying them or keeping them if I could partial replace, but better to do UI block replace)

    const handleFileSelect = (e) => {
        if (e.target.files) {
            addFiles(Array.from(e.target.files));
        }
    };

    const addFiles = (newFiles) => {
        // Take only the first file
        const fileToProcess = newFiles[0];
        if (!fileToProcess) return;

        const validFiles = [fileToProcess].filter(f =>
            f.type.startsWith('image/') || f.type === 'application/pdf'
        );

        const fileObjects = validFiles.map(f => ({
            file: f,
            id: crypto.randomUUID(),
            name: f.name,
            year: year,
            session: session,
            status: 'pending'
        }));

        setFiles(fileObjects); // Replace instead of append
    };

    const removeFile = (id) => {
        setFiles(files.filter(f => f.id !== id));
    };

    const handleStartProcessing = () => {
        if (files.length === 0) return;
        onFilesSelected(files);
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Drop Zone */}
            <div
                className={`group relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-3xl transition-all duration-300 cursor-pointer overflow-hidden
                    ${isDragOver
                        ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]'
                        : 'border-zinc-700/50 bg-zinc-900/50 hover:bg-zinc-800/50 hover:border-zinc-600'
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput').click()}
            >
                <div className={`p-5 rounded-full mb-6 transition-all duration-300 ${isDragOver ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700 group-hover:text-white'}`}>
                    <UploadIcon size={32} />
                </div>

                <h3 className="text-xl font-bold text-zinc-200 mb-2 text-center">Drop question papers here</h3>
                <p className="text-zinc-500 text-sm text-center font-medium">
                    Support PDF, JPG, PNG (Max 10MB)
                </p>

                <input
                    id="fileInput"
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleFileSelect}
                />
            </div>

            {/* Metadata Inputs */}
            <div className="grid grid-cols-2 gap-6 p-6 rounded-2xl bg-zinc-900/30 border border-white/5 backdrop-blur-[1px]">
                <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Exam Year</label>
                    <input
                        type="number"
                        className="w-full bg-black/40 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-mono placeholder:text-zinc-700"
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Session / Type</label>
                    <input
                        type="text"
                        className="w-full bg-black/40 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-zinc-700"
                        value={session}
                        onChange={(e) => setSession(e.target.value)}
                        placeholder="e.g. Main"
                    />
                </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-zinc-400 px-2">
                        <span>Selected Files ({files.length})</span>
                    </div>

                    <div className="space-y-3">
                        {files.map(f => (
                            <div key={f.id} className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-700/50 rounded-xl group hover:border-zinc-600 transition-colors">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                                        <FileText size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-medium text-zinc-200 truncate pr-4">{f.name}</div>
                                        <div className="text-xs text-zinc-500 flex items-center gap-2">
                                            <span className="font-mono">{f.year}</span>
                                            <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                                            <span>{f.session}</span>
                                            <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                                            <span>{(f.file.size / 1024 / 1024).toFixed(2)} MB</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeFile(f.id)}
                                    className="p-2 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleStartProcessing}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all transform active:scale-[0.99]"
                    >
                        Start OCR Processing
                    </button>
                </div>
            )}
        </div>
    );
}
