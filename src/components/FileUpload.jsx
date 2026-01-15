import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet, X, Loader2 } from 'lucide-react';
import { parseFile } from '../utils/fileParser';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { useLanguage } from '../context/LanguageContext';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function FileUpload({ onDataLoaded }) {
    const { t } = useLanguage();
    const [isDragActive, setIsDragActive] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragActive(true);
        } else if (e.type === "dragleave") {
            setIsDragActive(false);
        }
    }, []);

    const processFile = async (file) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await parseFile(file);
            onDataLoaded(result);
        } catch (err) {
            setError(err.message || "Failed to process file.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    }, []);

    const handleChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <motion.div
                layout
                className={cn(
                    "relative border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-300 ease-out cursor-pointer group bg-white",
                    isDragActive ? "border-blue-500 bg-blue-50/50 scale-[1.02]" : "border-slate-300 hover:border-blue-400 hover:bg-slate-50",
                    error && "border-red-300 bg-red-50"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload').click()}
            >
                <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleChange}
                />

                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center py-8"
                        >
                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                            <p className="text-slate-600 font-medium">{t.processing}</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center"
                        >
                            <div className={cn(
                                "w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-colors duration-300",
                                isDragActive ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500"
                            )}>
                                <Upload className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 mb-2">
                                {t.uploadTitle}
                            </h3>
                            <p className="text-slate-500 max-w-sm mx-auto mb-6">
                                {t.uploadDesc}
                            </p>

                            <div className="flex gap-3 text-xs text-slate-400 font-medium uppercase tracking-wider">
                                <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                                    <FileSpreadsheet className="w-3 h-3" /> .CSV
                                </span>
                                <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                                    <FileSpreadsheet className="w-3 h-3" /> .XLSX
                                </span>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100 w-full">
                                <p className="text-xs text-slate-400 mb-3">{t.noFile}</p>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const demoData = {
                                            headers: ['Age', 'Income', 'Satisfaction Score', 'City'],
                                            data: Array.from({ length: 50 }, () => ({
                                                'Age': Math.floor(Math.random() * 60) + 18,
                                                'Income': Math.floor(Math.random() * 80000) + 20000,
                                                'Satisfaction Score': Math.floor(Math.random() * 10) + 1,
                                                'City': ['New York', 'London', 'Berlin', 'Tokyo'][Math.floor(Math.random() * 4)]
                                            }))
                                        };
                                        onDataLoaded(demoData);
                                    }}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline bg-blue-50 px-4 py-2 rounded-lg transition-colors"
                                >
                                    {t.loadDemo}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-center justify-center gap-2 text-sm"
                >
                    <X className="w-4 h-4" />
                    {error}
                </motion.div>
            )}
        </div>
    );
}
