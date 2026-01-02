import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FileUpload } from '../upload/FileUpload';
import { ReviewInterface } from '../ocr/ReviewInterface';
import { extractQuestionsWithPerplexity, generateAnswerWithPerplexity } from '../../lib/perplexity';
import { analyzeQuestions } from '../../lib/analysis';
import { FileText, Loader2, Plus, ArrowLeft, Layers, Calendar, ChevronRight, Key, BrainCircuit, Sparkles, Bot, AlertCircle, X, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { CollapsibleAnswer } from '../../components/CollapsibleAnswer';

// Helper to get file URL
const getFileUrl = (filePath) => {
    const { data } = supabase.storage.from('papers').getPublicUrl(filePath);
    return data.publicUrl;
};

// Pre-process content to replace \[ \] and \( \) with $$ $$ and $ $ for remark-math
const preprocessLaTeX = (content) => {
    if (typeof content !== 'string') return content;
    return content
        .replace(/\\\[([\s\S]*?)\\\]/g, '$$$1$$') // Replace \[ ... \] with $$ ... $$
        .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$'); // Replace \( ... \) with $ ... $
};

export function SubjectDashboard() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [subject, setSubject] = useState(null);
    const [viewState, setViewState] = useState('list'); // list, upload, processing, review

    // Auth State
    const [apiKey, setApiKey] = useState(localStorage.getItem('perplexity_api_key') || '');
    const [showKeyInit, setShowKeyInit] = useState(false);
    const [tempKey, setTempKey] = useState('');

    // OCR State
    const [currentFileIndex, setCurrentFileIndex] = useState(0);
    const [uploadQueue, setUploadQueue] = useState([]);
    const [processedBlocks, setProcessedBlocks] = useState([]); // Structured blocks
    const [processingProgress, setProcessingProgress] = useState(0);

    const [existingFiles, setExistingFiles] = useState([]);

    // Analysis State
    const [analysisResults, setAnalysisResults] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Answer State
    const [generatingId, setGeneratingId] = useState(null);
    const [answers, setAnswers] = useState({}); // { questionId: "Answer text..." }
    const [warning, setWarning] = useState(null);

    // File Preview State
    const [viewingFile, setViewingFile] = useState(null);


    useEffect(() => {
        fetchSubjectDetails();
    }, [id]);

    const fetchSubjectDetails = async () => {
        const { data: sub } = await supabase.from('subjects').select('*').eq('id', id).single();
        setSubject(sub);
        const { data: files } = await supabase.from('files').select('*').eq('subject_id', id);
        setExistingFiles(files || []);

        // Auto-run analysis if files exist
        if (files && files.length > 0) {
            runAnalysis(files); // Pass directly to avoid stale state
        }
    };

    const saveApiKey = () => {
        if (!tempKey.trim() || !tempKey.startsWith('pplx-')) {
            alert("Invalid Key: Perplexity keys usually start with 'pplx-'");
            return;
        }
        localStorage.setItem('perplexity_api_key', tempKey);
        setApiKey(tempKey);
        setShowKeyInit(false);
        alert(`Authentication Successful!\nPerplexity Key saved.`);
    };

    const handleGenerateAnswer = async (question) => {
        if (!apiKey) {
            setShowKeyInit(true);
            return;
        }

        setGeneratingId(question.id);
        try {
            // Use the same Perplexity Key for answers
            const answerContent = await generateAnswerWithPerplexity(question.text_content, apiKey);

            // 1. Update UI immediately
            setAnswers(prev => ({
                ...prev,
                [question.id]: answerContent
            }));

            // 2. Persist to "answers" table
            // Check if answer exists to update or insert
            const { data: existing } = await supabase
                .from('answers')
                .select('id')
                .eq('question_id', question.id)
                .single();

            if (existing) {
                const { error } = await supabase
                    .from('answers')
                    .update({ content: answerContent, model_used: 'perplexity-sonar' })
                    .eq('id', existing.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('answers')
                    .insert({
                        question_id: question.id,
                        content: answerContent,
                        model_used: 'perplexity-sonar'
                    });
                if (error) throw error;
            }

        } catch (err) {
            console.error("Answer Error:", err);
            alert("Failed to save answer: " + err.message);
        } finally {
            setGeneratingId(null);
        }
    };

    const handleFilesSelected = async (filesWithMeta) => {
        if (!apiKey) {
            setShowKeyInit(true);
            setUploadQueue(filesWithMeta); // Queue them up
            return;
        }
        setUploadQueue(filesWithMeta);
        setViewState('processing');
        processNextFile(filesWithMeta[0], 0);
    };

    const processNextFile = async (fileObj, index) => {
        try {
            setProcessingProgress(0);
            setCurrentFileIndex(index);

            console.log("Invoking Perplexity for:", fileObj.name);

            // Call Perplexity Service
            const data = await extractQuestionsWithPerplexity(fileObj.file, apiKey, (p) => setProcessingProgress(p * 100));

            console.log("Perplexity Complete:", data);

            // Map JSON to Review Blocks format
            const blocks = data.map(q => ({
                text: `${q.question_number ? q.question_number + '. ' : ''}${q.text} ${q.marks ? '[' + q.marks + ' marks]' : ''} `.trim()
            }));

            setProcessedBlocks(blocks);
            setViewState('review');
        } catch (err) {
            console.error("Scanning Failed:", err);
            alert('Smart Scan Failed: ' + err.message + "\n\n(Check your API Key or Quota)");
            setViewState('list');
        }
    };

    const handleSaveQuestions = async (approvedBlocks) => {
        const currentFile = uploadQueue[currentFileIndex];

        // 1. Upload to Supabase Storage
        const fileExt = currentFile.name.split('.').pop();
        const fileName = `${id}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('papers')
            .upload(fileName, currentFile.file);

        if (uploadError) {
            alert("Upload Failed: " + uploadError.message);
            return;
        }

        // 2. Insert File Record
        const { data: fileData, error: fErr } = await supabase.from('files').insert({
            subject_id: id,
            name: currentFile.name,
            file_path: fileName, // Use actual path
            file_type: currentFile.file.type.includes('pdf') ? 'pdf' : 'image',
            year: currentFile.year,
            exam_session: currentFile.session,
            session_id: subject.session_id
        }).select().single();

        if (fErr) { alert(fErr.message); return; }

        // Insert Questions
        const payload = approvedBlocks.map(block => ({
            subject_id: id,
            file_id: fileData.id,
            text_content: block.text,
            normalized_text: block.text.toLowerCase().replace(/[^a-z0-9]/g, ''),
            session_id: subject.session_id
        }));

        const { error: qErr } = await supabase.from('questions').insert(payload);

        if (qErr) {
            console.error("Insert Error", qErr);
            alert("Database Error: " + qErr.message);
            return;
        }

        if (currentFileIndex < uploadQueue.length - 1) {
            processNextFile(uploadQueue[currentFileIndex + 1], currentFileIndex + 1);
        } else {
            setViewState('list');
            fetchSubjectDetails();
        }
    };

    const runAnalysis = async (filesContext = null) => {
        const filesToCheck = filesContext || existingFiles;

        if (filesToCheck.length === 0) {
            setWarning("Please upload at least one paper first!");
            setTimeout(() => setWarning(null), 3000);
            return;
        }
        setIsAnalyzing(true);
        // 1. Fetch Questions
        const { data: questions, error: qErr } = await supabase
            .from('questions')
            .select('*')
            .eq('subject_id', id);

        if (qErr) {
            alert('Error fetching questions: ' + qErr.message);
            setIsAnalyzing(false);
            return;
        }

        // 2. Fetch Files
        const { data: files, error: fErr } = await supabase
            .from('files')
            .select('*')
            .eq('subject_id', id);

        // 3. Join
        const flatQuestions = questions.map(q => {
            const file = files?.find(f => f.id === q.file_id);
            return {
                ...q,
                year: file?.year || 'Unknown',
                session: file?.exam_session || 'Unknown'
            };
        });

        // 4. Fetch and Populate Answers from 'answers' table
        const { data: dbAnswers } = await supabase
            .from('answers')
            .select('question_id, content')
            .in('question_id', flatQuestions.map(q => q.id));

        const loadedAnswers = {};
        if (dbAnswers) {
            dbAnswers.forEach(ans => {
                loadedAnswers[ans.question_id] = ans.content;
            });
        }

        setAnswers(prev => ({ ...prev, ...loadedAnswers }));

        const results = analyzeQuestions(flatQuestions);
        setAnalysisResults(results);
        setIsAnalyzing(false);
    };

    if (!subject) return <div className="p-10 flex items-center justify-center text-zinc-500"><Loader2 className="animate-spin mr-2" /> Loading...</div>;

    return (
        <div className="w-full h-full pb-20 p-6 animate-in">
            {/* Back Link */}
            <button
                onClick={() => viewState === 'list' ? navigate('/dashboard') : setViewState('list')}
                className="mb-6 flex items-center text-sm text-zinc-400 hover:text-white transition-colors"
            >
                <ArrowLeft size={16} className="mr-1" />
                {viewState === 'list' ? 'Back to Subjects' : 'Back to Dashboard'}
            </button>

            {/* Perplexity Key Modal */}
            {showKeyInit && (
                <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        <div className="mb-6 text-center">
                            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Key size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Enable Perplexity AI</h2>
                            <p className="text-zinc-400 text-sm">
                                Enter your <strong>Perplexity API Key</strong> (pplx-...) to enable smart scanning and answers.
                            </p>
                        </div>
                        <input
                            type="password"
                            placeholder="pplx-..."
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white mb-4 focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={tempKey}
                            onChange={(e) => setTempKey(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') saveApiKey();
                            }}
                        />
                        <button
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-bold text-white mb-4"
                            onClick={saveApiKey}
                        >
                            Save & Continue
                        </button>
                    </div>
                </div>
            )}

            {viewState === 'list' && (
                <>
                    {/* Header */}
                    <header className="mb-10 p-8 rounded-3xl bg-zinc-900/40 backdrop-blur-md border border-white/10 shadow-2xl relative overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-white">
                                    {subject.name}
                                </h1>
                                <p className="flex items-center text-zinc-400 gap-4">
                                    <span className="flex items-center gap-1.5"><Layers size={16} /> {existingFiles.length} papers</span>
                                    <span className="flex items-center gap-1.5"><Calendar size={16} /> {subject.year || '2025'} Session</span>
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setViewState('upload')}
                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <Plus size={20} strokeWidth={3} /> Upload New Paper
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 relative">
                        {/* Warning Notification */}
                        {warning && (
                            <div className="absolute -top-12 left-0 bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                                <AlertCircle size={16} /> {warning}
                            </div>
                        )}
                        <button
                            onClick={runAnalysis}
                            disabled={isAnalyzing}
                            className="p-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 border border-indigo-500 shadow-lg group transition-all text-left disabled:opacity-50"
                        >
                            <h3 className="text-indigo-200 text-sm font-medium mb-1">
                                {isAnalyzing ? 'Crunching Data...' : 'Run Analysis'}
                            </h3>
                            <p className="text-2xl font-bold text-white flex items-center gap-2">
                                {isAnalyzing ? <Loader2 className="animate-spin" /> : 'Start Magic'}
                            </p>
                        </button>

                        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 backdrop-blur-sm">
                            <h3 className="text-zinc-500 text-sm font-medium mb-1">Repeated Questions</h3>
                            <p className="text-2xl font-bold text-zinc-100">
                                {analysisResults.filter(r => r.frequency > 1).length} Found
                            </p>
                        </div>
                        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 backdrop-blur-sm">
                            <h3 className="text-zinc-500 text-sm font-medium mb-1">Total Questions</h3>
                            <p className="text-2xl font-bold text-zinc-100">
                                {analysisResults.reduce((acc, curr) => acc + curr.frequency, 0)}
                            </p>
                        </div>
                    </div>

                    {/* Most Probable */}
                    {isAnalyzing ? (
                        <div className="py-20 text-center">
                            <Loader2 className="animate-spin mx-auto text-indigo-500 mb-4" size={40} />
                            <p className="text-zinc-400">Loading your analysis...</p>
                        </div>
                    ) : (
                        <>
                            {analysisResults.length > 0 && (
                                <div className="mb-12 animate-in slide-in-from-bottom-5">
                                    <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                                        🎯 Most Probable Questions
                                    </h2>
                                    <div className="space-y-4">
                                        {analysisResults.slice(0, 5).map((group, idx) => (
                                            <div key={idx} className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-4">
                                                    <span className={`px - 3 py - 1 rounded - full text - xs font - bold uppercase tracking - wider ${group.frequency > 2 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                                                        } `}>
                                                        {group.frequency} Repeats
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-medium text-zinc-200 mb-4 pr-16 leading-relaxed">
                                                    {group.leader.text_content}
                                                </h3>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={14} /> Seen in: <span className="text-zinc-400">{group.years}</span>
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleGenerateAnswer(group.leader)}
                                                        disabled={generatingId === group.leader.id}
                                                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-2 border border-zinc-700"
                                                    >
                                                        {generatingId === group.leader.id ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                                                        {answers[group.leader.id] ? 'Regenerate' : 'Answer with AI'}
                                                    </button>
                                                </div>

                                                {answers[group.leader.id] && (
                                                    <CollapsibleAnswer content={answers[group.leader.id]} />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* All Questions List */}
                            {analysisResults.length > 0 && (
                                <div className="mb-12 animate-in slide-in-from-bottom-5 delay-100">
                                    <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                                        📚 Full Question Bank <span className="text-zinc-500 text-sm font-normal">({analysisResults.length} unique)</span>
                                    </h2>
                                    <div className="grid grid-cols-1 gap-3">
                                        {analysisResults.map((group, idx) => (
                                            <div key={idx} className="flex flex-col gap-3 p-4 rounded-lg bg-zinc-900/50 border border-zinc-800/50 hover:bg-zinc-900 transition-colors">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="flex-1">
                                                        <p className="text-zinc-300 text-base mb-2">{group.leader.text_content}</p>
                                                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                                                            <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">
                                                                {group.frequency} Occurrences
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Calendar size={12} /> {group.years}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleGenerateAnswer(group.leader)}
                                                        disabled={generatingId === group.leader.id}
                                                        className="shrink-0 p-2 rounded-full bg-zinc-800/50 text-white hover:bg-zinc-800 transition-all border border-zinc-700"
                                                        title="Solve with AI"
                                                    >
                                                        {generatingId === group.leader.id ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                                                    </button>
                                                </div>

                                                {/* Answer Display */}
                                                {answers[group.leader.id] && (
                                                    <CollapsibleAnswer content={answers[group.leader.id]} />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                                Uploaded Files <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400 font-normal">{existingFiles.length}</span>
                            </h2>

                            <div className="grid grid-cols-1 gap-4">
                                {existingFiles.length === 0 ? (
                                    <div className="py-20 text-center border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/50">
                                        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <FileText size={32} className="text-zinc-500" />
                                        </div>
                                        <h3 className="text-lg font-medium text-white">No papers uploaded yet</h3>
                                        <p className="text-zinc-500 max-w-sm mx-auto mt-2 mb-6">
                                            Upload your previous year question papers to start the magical analysis.
                                        </p>
                                        <button onClick={() => setViewState('upload')} className="text-indigo-400 hover:text-indigo-300 hover:underline font-medium">
                                            Upload your first file &rarr;
                                        </button>
                                    </div>
                                ) : (
                                    existingFiles.map(file => (
                                        <div
                                            key={file.id}
                                            onClick={() => setViewingFile({ ...file, url: getFileUrl(file.file_path) })}
                                            className="group p-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-all flex items-center gap-4 cursor-pointer"
                                        >
                                            <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                                <Eye size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-lg text-zinc-200 group-hover:text-white transition-colors">{file.name}</h4>
                                                <p className="text-sm text-zinc-500">
                                                    {file.year} • {file.exam_session} Session
                                                </p>
                                            </div>
                                            <ChevronRight className="text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </>
            )}

            {/* Upload/Processing Views Wrapper */}
            {viewState !== 'list' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
                    {viewState === 'upload' && <FileUpload onFilesSelected={handleFilesSelected} />}

                    {viewState === 'processing' && (
                        <div className="flex flex-col items-center py-12">
                            <BrainCircuit size={64} className="animate-pulse text-emerald-500 mb-6" />
                            <h2 className="text-2xl font-bold mb-2 text-white">Perplexity is Thinking...</h2>
                            <p className="text-zinc-400">Analyzing layout and extracting questions from <span className="text-white font-medium">{uploadQueue[currentFileIndex]?.name}</span></p>

                            <div className="w-64 h-1.5 bg-zinc-800 mt-8 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${processingProgress}% ` }} />
                            </div>
                        </div>
                    )}

                    {viewState === 'review' && (
                        <ReviewInterface initialBlocks={processedBlocks} onSave={handleSaveQuestions} />
                    )}
                </div>
            )}

            {/* File Preview Modal */}
            {viewingFile && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-10">
                    <div
                        className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
                        onClick={() => setViewingFile(null)}
                    />
                    <div className="relative z-10 bg-zinc-900 w-full h-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-800">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900">
                            <h3 className="text-white font-medium truncate px-2">{viewingFile.name}</h3>
                            <button
                                onClick={() => setViewingFile(null)}
                                className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors bg-black/20"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-auto bg-black/50 p-4 flex items-center justify-center">
                            {viewingFile.name.toLowerCase().endsWith('.pdf') ? (
                                <iframe
                                    src={viewingFile.url}
                                    className="w-full h-full rounded-lg bg-white shadow-lg"
                                    title="PDF Preview"
                                />
                            ) : (
                                <img
                                    src={viewingFile.url}
                                    alt="Preview"
                                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                                />
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-zinc-800 flex justify-end gap-2 bg-zinc-900">
                            <a
                                href={viewingFile.url}
                                download={viewingFile.name}
                                target="_blank"
                                rel="noreferrer"
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-indigo-500/20"
                            >
                                Download Original
                            </a>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
