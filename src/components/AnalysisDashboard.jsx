import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, Phone, CheckCircle2, XCircle } from 'lucide-react';
import { calculateStats } from '../utils/statsEngine';
import * as XLSX from 'xlsx';
import { useLanguage } from '../context/LanguageContext';
import DataVisualization from './DataVisualization';

export default function AnalysisDashboard({ data, columnTypes }) {
    const { t } = useLanguage();
    const [groupingVariable, setGroupingVariable] = React.useState('');
    const [activeTab, setActiveTab] = React.useState('analysis');

    const stats = useMemo(() => calculateStats(data, columnTypes, groupingVariable), [data, columnTypes, groupingVariable]);

    const potentialGroups = useMemo(() => {
        return Object.keys(columnTypes).filter(col => 
            columnTypes[col] === 'nominal' || columnTypes[col] === 'ordinal'
        );
    }, [columnTypes]);

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
            className="space-y-6"
        >
            {/* Tab Navigation */}
            <div className="flex justify-center mb-6">
                <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
                    <button
                        onClick={() => setActiveTab('analysis')}
                        className={`px-8 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                            activeTab === 'analysis' 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                    >
                        {t.analyzeTab}
                    </button>
                    <button
                        onClick={() => setActiveTab('visualize')}
                        className={`px-8 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                            activeTab === 'visualize' 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                    >
                        {t.visualizeTab}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {activeTab === 'analysis' && (
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">{t.resultsTitle}</h2>
                        <p className="text-slate-500 text-sm">{t.resultsDesc}</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-slate-700">{t.groupingVariable}:</label>
                            <select 
                                value={groupingVariable}
                                onChange={(e) => setGroupingVariable(e.target.value)}
                                className="border border-slate-300 rounded-lg px-3 py-1.5 object-contain text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="">{t.noGrouping}</option>
                                {potentialGroups.map(group => (
                                    <option key={group} value={group}>{group}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            {t.downloadReport}
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left text-xs text-slate-600 min-w-[1000px]">
                        <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-3 py-3 w-[15%]">{t.varHeader}</th>
                                <th className="px-3 py-3 w-[8%]">{t.typeHeader}</th>
                                <th className="px-3 py-3">{t.meanHeader}</th>
                                <th className="px-3 py-3">{t.medianHeader}</th>
                                <th className="px-3 py-3">{t.modeHeader}</th>
                                <th className="px-3 py-3">{t.q1Header}</th>
                                <th className="px-3 py-3">{t.q3Header}</th>
                                <th className="px-3 py-3">{t.iqrHeader}</th>
                                <th className="px-3 py-3">{t.stdDevHeader}</th>
                                <th className="px-3 py-3">{t.pValueHeader}</th>
                                <th className="px-3 py-3 w-[10%]">{t.normHeader}</th>
                                <th className="px-3 py-3 w-[10%]">{t.homogeneityHeader}</th>
                                <th className="px-3 py-3 w-[15%]">{t.recTestHeader}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {stats.map((row) => (
                                <tr key={row.variable} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-3 py-3 font-medium text-slate-900 truncate max-w-[150px]" title={row.variable}>{row.variable}</td>
                                    <td className="px-3 py-3 capitalize">
                                        <span className="bg-blue-50 text-blue-700 py-1 px-2 rounded-md text-[11px] font-semibold">
                                            {t[row.type] || row.type}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap">{row.mean}</td>
                                    <td className="px-3 py-3 whitespace-nowrap">{row.median}</td>
                                    <td className="px-3 py-3 whitespace-nowrap">{row.mode}</td>
                                    <td className="px-3 py-3 whitespace-nowrap">{row.q1}</td>
                                    <td className="px-3 py-3 whitespace-nowrap">{row.q3}</td>
                                    <td className="px-3 py-3 whitespace-nowrap">{row.iqr}</td>
                                    <td className="px-3 py-3 whitespace-nowrap">{row.stdDev}</td>
                                    <td className="px-3 py-3 whitespace-nowrap">{row.pValue}</td>
                                    <td className="px-3 py-3">
                                        {/* Logic to show Yes/No and details */}
                                        {row.isNormal === "Yes" || row.isNormal === "Yes (Approx)" ? (
                                            <div className="flex flex-col">
                                                <span className="flex items-center gap-1 text-emerald-600 font-bold whitespace-nowrap">
                                                    <CheckCircle2 className="w-3 h-3" /> {t.yes}
                                                </span>
                                                <span className="text-[10px] text-slate-400 whitespace-nowrap">{row.normality}</span>
                                            </div>
                                        ) : row.isNormal === "No" ? (
                                            <div className="flex flex-col">
                                                <span className="flex items-center gap-1 text-amber-600 font-medium whitespace-nowrap">
                                                    <XCircle className="w-3 h-3" /> {t.no}
                                                </span>
                                                <span className="text-[10px] text-slate-400 whitespace-nowrap">{row.normality}</span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-3">
                                        {/* Homogeneity Logic */}
                                        {row.isHomogeneous === "Yes" ? (
                                            <div className="flex flex-col">
                                                <span className="flex items-center gap-1 text-emerald-600 font-bold whitespace-nowrap">
                                                    <CheckCircle2 className="w-3 h-3" /> {t.yes}
                                                </span>
                                                <span className="text-[10px] text-slate-400 whitespace-nowrap">{row.homogeneity}</span>
                                            </div>
                                        ) : row.isHomogeneous === "No" ? (
                                            <div className="flex flex-col">
                                                <span className="flex items-center gap-1 text-amber-600 font-medium whitespace-nowrap">
                                                    <XCircle className="w-3 h-3" /> {t.no}
                                                </span>
                                                <span className="text-[10px] text-slate-400 whitespace-nowrap">{row.homogeneity}</span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-3 font-semibold text-blue-700 whitespace-nowrap">
                                        {row.recommendedTest !== '-' && row.recommendedTest !== 'Error' && row.recommendedTest !== 'N/A' 
                                            ? t[row.recommendedTest] 
                                            : <span className="text-slate-400 font-normal">-</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                </div>
            )}

            {activeTab === 'visualize' && (
                <div className="h-[600px]">
                    <DataVisualization data={data} columnTypes={columnTypes} />
                </div>
            )}

            {/* Contact Form Section */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-8 text-white text-center mt-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/30 rounded-full mix-blend-overlay filter blur-3xl -ml-20 -mb-20"></div>
                <h3 className="text-3xl font-bold mb-4 relative z-10">{t.contactTitle}</h3>
                <p className="text-blue-100 max-w-2xl mx-auto mb-8 text-lg relative z-10">
                    {t.contactDesc}
                </p>

                <a 
                    href="mailto:virtusarge@gmail.com?subject=İleri%20Düzey%20Analiz%20Talebi"
                    className="inline-block bg-white text-blue-700 font-bold text-lg py-3 px-8 rounded-xl shadow-lg transition-all transform hover:-translate-y-1 hover:shadow-xl relative z-10"
                >
                    {t.sendBtn}
                </a>
            </div>

        </motion.div>
    );
}
