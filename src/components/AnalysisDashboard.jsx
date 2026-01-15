import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, Phone, CheckCircle2, XCircle } from 'lucide-react';
import { calculateStats } from '../utils/statsEngine';
import * as XLSX from 'xlsx';
import { useLanguage } from '../context/LanguageContext';

export default function AnalysisDashboard({ data, columnTypes }) {
    const { t } = useLanguage();
    const stats = useMemo(() => calculateStats(data, columnTypes), [data, columnTypes]);

    const handleDownload = () => {
        const ws = XLSX.utils.json_to_sheet(stats);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Summary Statistics");
        XLSX.writeFile(wb, "VirtusStat_Analysis_Report.xlsx");
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
        >

            {/* Stats Table */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">{t.resultsTitle}</h2>
                        <p className="text-slate-500 text-sm">{t.resultsDesc}</p>
                    </div>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        {t.downloadReport}
                    </button>
                </div>

                <div className="">
                    <table className="w-full text-left text-xs text-slate-600 table-fixed">
                        <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-2 py-2 w-[15%]">{t.varHeader}</th>
                                <th className="px-2 py-2 w-[8%]">{t.typeHeader}</th>
                                <th className="px-2 py-2">{t.meanHeader}</th>
                                <th className="px-2 py-2">{t.medianHeader}</th>
                                <th className="px-2 py-2">{t.modeHeader}</th>
                                <th className="px-2 py-2">{t.q1Header}</th>
                                <th className="px-2 py-2">{t.q3Header}</th>
                                <th className="px-2 py-2">{t.iqrHeader}</th>
                                <th className="px-2 py-2">{t.stdDevHeader}</th>
                                <th className="px-2 py-2">{t.pValueHeader}</th>
                                <th className="px-2 py-2 w-[10%]">{t.normHeader}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {stats.map((row) => (
                                <tr key={row.variable} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-2 py-2 font-medium text-slate-900 truncate" title={row.variable}>{row.variable}</td>
                                    <td className="px-2 py-2 capitalize">
                                        <span className="bg-blue-50 text-blue-700 py-0.5 px-1.5 rounded text-[10px] font-semibold">
                                            {t[row.type] || row.type}
                                        </span>
                                    </td>
                                    <td className="px-2 py-2">{row.mean}</td>
                                    <td className="px-2 py-2">{row.median}</td>
                                    <td className="px-2 py-2">{row.mode}</td>
                                    <td className="px-2 py-2">{row.q1}</td>
                                    <td className="px-2 py-2">{row.q3}</td>
                                    <td className="px-2 py-2">{row.iqr}</td>
                                    <td className="px-2 py-2">{row.stdDev}</td>
                                    <td className="px-2 py-2">{row.pValue}</td>
                                    <td className="px-2 py-2">
                                        {/* Logic to show Yes/No and details */}
                                        {row.isNormal === "Yes" || row.isNormal === "Yes (Approx)" ? (
                                            <div className="flex flex-col">
                                                <span className="flex items-center gap-1 text-emerald-600 font-bold">
                                                    <CheckCircle2 className="w-3 h-3" /> {t.yes}
                                                </span>
                                                <span className="text-[9px] text-slate-400">{row.normality}</span>
                                            </div>
                                        ) : row.isNormal === "No" ? (
                                            <div className="flex flex-col">
                                                <span className="flex items-center gap-1 text-amber-600 font-medium">
                                                    <XCircle className="w-3 h-3" /> {t.no}
                                                </span>
                                                <span className="text-[9px] text-slate-400">{row.normality}</span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Contact Form Section */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-8 text-white text-center">
                <h3 className="text-2xl font-bold mb-3">{t.contactTitle}</h3>
                <p className="text-blue-100 max-w-2xl mx-auto mb-8">
                    {t.contactDesc}
                </p>

                <form className="max-w-md mx-auto space-y-4 text-left bg-white/10 p-6 rounded-xl backdrop-blur-sm border border-white/10">
                    <div>
                        <label className="block text-sm font-medium text-blue-100 mb-1">{t.emailLabel}</label>
                        <input type="email" placeholder="john@example.com" className="w-full px-4 py-2 rounded-lg bg-white/90 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-blue-100 mb-1">{t.msgLabel}</label>
                        <textarea rows={3} placeholder={t.msgPlaceholder} className="w-full px-4 py-2 rounded-lg bg-white/90 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300"></textarea>
                    </div>
                    <button className="w-full bg-white text-blue-600 font-bold py-3 rounded-lg hover:bg-blue-50 transition-colors shadow-lg">
                        {t.sendBtn}
                    </button>
                </form>
            </div>

        </motion.div>
    );
}
