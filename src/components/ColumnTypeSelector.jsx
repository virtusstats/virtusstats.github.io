import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, HelpCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useLanguage } from '../context/LanguageContext';

export default function ColumnTypeSelector({ data, headers, onConfirm }) {
    const { t } = useLanguage();
    const [columnTypes, setColumnTypes] = useState({});

    const VARIABLE_TYPES = [
        { id: 'nominal', label: t.nominal, desc: t.nominalDesc },
        { id: 'ordinal', label: t.ordinal, desc: t.ordinalDesc },
        { id: 'interval', label: t.interval, desc: t.intervalDesc },
        { id: 'ratio', label: t.ratio, desc: t.ratioDesc },
    ];

    useEffect(() => {
        // Auto-detect types
        const initialTypes = {};
        headers.forEach(header => {
            const sampleValues = data.slice(0, 100).map(row => row[header]);
            const nonNullValues = sampleValues.filter(v => v !== null && v !== undefined && v !== '');

            const isNumeric = nonNullValues.every(v => !isNaN(parseFloat(v)) && isFinite(v));
            const uniqueValues = new Set(nonNullValues).size;

            if (isNumeric) {
                if (uniqueValues < 5) {
                    initialTypes[header] = 'ordinal';
                } else {
                    initialTypes[header] = 'ratio';
                }
            } else {
                if (uniqueValues < 20) {
                    initialTypes[header] = 'nominal';
                } else {
                    initialTypes[header] = 'nominal';
                }
            }
        });
        setColumnTypes(initialTypes);
    }, [data, headers]);

    const handleTypeChange = (header, type) => {
        setColumnTypes(prev => ({
            ...prev,
            [header]: type
        }));
    };

    const handleContinue = () => {
        onConfirm(columnTypes);
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-2xl font-bold text-slate-800">{t.colTypeTitle}</h2>
                <p className="text-slate-500 mt-1">
                    {t.colTypeDesc}
                </p>
            </div>

            <div className="p-6">
                <div className="grid gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {headers.map((header) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={header}
                            className="group p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all bg-white"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-slate-800 text-lg">{header}</h3>
                                        <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                            {t.sample}: {String(data[0]?.[header] || '').substring(0, 15)}...
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2 bg-slate-100 p-1 rounded-lg flex-wrap">
                                    {VARIABLE_TYPES.map((type) => {
                                        const isSelected = columnTypes[header] === type.id;
                                        return (
                                            <button
                                                key={type.id}
                                                onClick={() => handleTypeChange(header, type.id)}
                                                className={clsx(
                                                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                                    isSelected
                                                        ? "bg-white text-blue-700 shadow-sm ring-1 ring-black/5"
                                                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                                )}
                                                title={type.desc}
                                            >
                                                {type.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleContinue}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-blue-600/20"
                    >
                        {t.generateAnalysis}
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
