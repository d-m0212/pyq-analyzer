import React, { useEffect, useState } from 'react';
import { Plus, Layers, ArrowRight, Edit2, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

export function SubjectList() {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Modal State
    const [modal, setModal] = useState({ open: false, type: 'create', value: '', id: null });

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            const { data, error } = await supabase
                .from('subjects')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSubjects(data || []);
        } catch (err) {
            console.error('Error fetching subjects:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleModalSubmit = async (e) => {
        e.preventDefault();

        if (modal.type === 'delete') {
            await confirmDelete(modal.id);
            setModal({ ...modal, open: false });
            return;
        }

        const name = modal.value.trim();
        if (!name) return;

        if (modal.type === 'create') {
            await createSubject(name);
        } else {
            await updateSubjectApi(modal.id, name);
        }
        setModal({ ...modal, open: false, value: '' });
    };

    const createSubject = async (name) => {
        const sessionId = localStorage.getItem('temp_session_id') || crypto.randomUUID();
        localStorage.setItem('temp_session_id', sessionId);

        try {
            const { data, error } = await supabase
                .from('subjects')
                .insert([{ name, session_id: sessionId }])
                .select()
                .single();

            if (error) throw error;
            setSubjects([data, ...subjects]);
        } catch (err) {
            alert(err.message);
        }
    };

    const updateSubjectApi = async (id, newName) => {
        try {
            const { error } = await supabase
                .from('subjects')
                .update({ name: newName })
                .eq('id', id);

            if (error) throw error;
            setSubjects(subjects.map(s => s.id === id ? { ...s, name: newName } : s));
        } catch (err) {
            alert(err.message);
        }
    };

    const openEditModal = (e, subject) => {
        e.stopPropagation();
        setModal({ open: true, type: 'edit', value: subject.name, id: subject.id });
    };

    const deleteSubject = async (e, id) => {
        e.stopPropagation();
        setModal({ open: true, type: 'delete', value: '', id });
    };

    const confirmDelete = async (id) => {
        try {
            const { error } = await supabase
                .from('subjects')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setSubjects(subjects.filter(s => s.id !== id));
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-700">
            <header className="mb-10">
                <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-white drop-shadow-lg">Global Subjects</h1>
                <p className="text-zinc-400 font-light">
                    Select a subject to manage files and generate answers.
                </p>
            </header>

            {loading ? (
                <div className="flex items-center gap-2 text-zinc-400">
                    <span className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></span>
                    Loading subjects...
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {/* Create Button Card */}
                    <button
                        onClick={() => setModal({ open: true, type: 'create', value: '', id: null })}
                        className="group relative flex flex-col items-center justify-center h-64 rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 to-white/0 hover:from-indigo-500/20 hover:to-purple-500/20 backdrop-blur-md transition-all duration-500 overflow-hidden shadow-2xl hover:shadow-indigo-500/20 hover:border-indigo-500/30 active:scale-95 px-6"
                    >
                        <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />

                        <div className="relative z-10 p-6 rounded-full bg-white/5 border border-white/10 group-hover:bg-indigo-500 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all duration-300 mb-6 text-zinc-400 group-hover:text-white">
                            <Plus size={40} strokeWidth={2} />
                        </div>
                        <span className="relative z-10 text-xl font-bold text-center text-zinc-300 group-hover:text-white tracking-wide transition-colors">Create Subject</span>
                    </button>

                    {/* Subject Cards */}
                    {subjects.map((subject) => (
                        <div
                            key={subject.id}
                            onClick={() => navigate(`/dashboard/subject/${subject.id}`)}
                            className="group relative p-6 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-md hover:border-indigo-500/30 hover:bg-black/60 transition-all cursor-pointer flex flex-col justify-between h-64 shadow-xl hover:shadow-2xl overflow-hidden"
                        >
                            {/* Hover Actions */}
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                <button
                                    className="p-2 rounded-lg bg-black/50 hover:bg-indigo-500 text-zinc-400 hover:text-white transition-colors backdrop-blur-sm"
                                    onClick={(e) => openEditModal(e, subject)}
                                    title="Rename"
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button
                                    className="p-2 rounded-lg bg-black/50 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors backdrop-blur-sm"
                                    onClick={(e) => deleteSubject(e, subject.id)}
                                    title="Delete"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <div className="relative z-10">
                                <div className="mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-400 mb-4 border border-white/5">
                                        <Layers size={24} strokeWidth={1.5} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white tracking-tight line-clamp-2">{subject.name}</h3>
                                </div>
                                <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest">
                                    CREATED {new Date(subject.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                </p>
                            </div>

                            <div className="relative z-10 flex items-center text-sm font-semibold text-indigo-400 mt-4 group/link">
                                Open Dashboard <ArrowRight size={16} className="ml-2 group-hover/link:translate-x-1 transition-transform" />
                            </div>

                            {/* Decorative Gradient */}
                            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-indigo-500/20 transition-all" />
                        </div>
                    ))}
                </div>
            )}

            {/* Custom Modal */}
            <AnimatePresence>
                {modal.open && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setModal({ ...modal, open: false })}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="relative w-full max-w-md bg-zinc-900 border border-zinc-700/50 rounded-2xl p-6 shadow-2xl"
                        >
                            <button
                                onClick={() => setModal({ ...modal, open: false })}
                                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-all hover:rotate-90 active:scale-90"
                            >
                                <X size={20} />
                            </button>

                            <h2 className="text-xl font-bold text-white mb-1">
                                {modal.type === 'create' ? 'Create New Subject' :
                                    modal.type === 'edit' ? 'Rename Subject' :
                                        'Confirm Deletion'}
                            </h2>
                            <p className="text-sm text-zinc-400 mb-6">
                                {modal.type === 'create' ? 'Enter a name for your new subject collection.' :
                                    modal.type === 'edit' ? 'Update the name of this subject.' :
                                        'Are you sure you want to delete this subject? This action cannot be undone.'}
                            </p>

                            <form onSubmit={handleModalSubmit}>
                                {modal.type !== 'delete' && (
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="e.g. Physics 101"
                                        className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 mb-6"
                                        value={modal.value}
                                        onChange={(e) => setModal({ ...modal, value: e.target.value })}
                                    />
                                )}

                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setModal({ ...modal, open: false })}
                                        className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={modal.type !== 'delete' && !modal.value.trim()}
                                        className={cn(
                                            "px-6 py-2 text-white text-sm font-bold rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed",
                                            modal.type === 'delete'
                                                ? "bg-red-600 hover:bg-red-500 shadow-red-500/20"
                                                : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20"
                                        )}
                                    >
                                        {modal.type === 'create' ? 'Create Subject' :
                                            modal.type === 'edit' ? 'Save Changes' :
                                                'Delete Subject'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
