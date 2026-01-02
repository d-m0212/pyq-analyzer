import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, BrainCircuit, Zap, FileText, ArrowRight, Github } from 'lucide-react';
import { toast } from 'sonner';
import ASMRStaticBackground from '../../components/ui/demo';

export function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30 font-sans overflow-x-hidden relative">
            {/* Background Layer - ASMR Effect (High Visibility) */}
            <div className="fixed inset-0 z-0 opacity-80 pointer-events-none">
                <ASMRStaticBackground />
                {/* Subtle gradient overlay to ensure text readability without hiding the effect */}
                <div className="absolute inset-0 bg-black/30 bg-gradient-to-b from-black/0 via-black/0 to-black/80" />
            </div>

            {/* Navbar */}
            <nav className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12 max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-600 rounded-lg">
                        <BrainCircuit size={24} className="text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">PYQ Analyzer</span>
                </div>
                <div className="flex items-center gap-4">
                    <a href="https://github.com" target="_blank" rel="noreferrer" className="p-2 text-zinc-400 hover:text-white transition-colors">
                        <Github size={20} />
                    </a>
                    <button
                        onClick={() => {
                            const toastId = toast.loading('Logging in with student account...');
                            setTimeout(() => {
                                toast.dismiss(toastId);
                                navigate('/dashboard');
                            }, 1500);
                        }}
                        className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-medium transition-all backdrop-blur-sm cursor-pointer"
                    >
                        Login
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 max-w-7xl mx-auto mt-20 px-6 md:px-12 flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-8"
                >
                    <Sparkles size={12} />
                    <span>AI-Powered Exam Prep</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500"
                >
                    Master Your Exams <br /> with <span className="text-indigo-500">Intelligent Analysis</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed"
                >
                    Stop guessing what to study. Upload your previous year question papers and let our AI analyze trends, predict questions, and generate answers instantly.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex flex-col md:flex-row items-center gap-4"
                >
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="group relative px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-full font-semibold text-lg transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 flex items-center gap-2 cursor-pointer"
                    >
                        Get Started
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </motion.div>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full">
                    {[
                        {
                            icon: <FileText size={24} />,
                            title: "Smart Extraction",
                            desc: "Upload PDFs or Images. Our OCR magically extracts questions and structures them."
                        },
                        {
                            icon: <BrainCircuit size={24} />,
                            title: "Pattern Analysis",
                            desc: "Identify the most repeated questions and critical topics across years."
                        },
                        {
                            icon: <Zap size={24} />,
                            title: "Instant Answers",
                            desc: "Get precise, AI-generated answers for every question with one click."
                        }
                    ].map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            viewport={{ once: true }}
                            className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 transition-all text-left group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 mb-4 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition-colors">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                            <p className="text-zinc-500 leading-relaxed text-sm">
                                {feature.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </main>

            {/* Simple Footer */}
            <footer className="mt-32 py-12 border-t border-zinc-900 text-center text-zinc-600 text-sm">
                <p>&copy; {new Date().getFullYear()} PYQ Analyzer. Built for Students.</p>
            </footer>
        </div>
    );
}
