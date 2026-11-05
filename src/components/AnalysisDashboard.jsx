import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Download, Link2, Save, Upload, XCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { calculateStats } from '../utils/statsEngine';
import { isCategoricalType, isNumericType, runAll, sanitizeConfig } from '../utils/analyses';
import { downloadAnalysis, parseShare, shareUrl } from '../utils/share';
import { useLanguage } from '../context/LanguageContext';
import DataVisualization from './DataVisualization';
import QualityPanel from './analysis/QualityPanel';
import GroupsPanel from './analysis/GroupsPanel';
import PairedPanel from './analysis/PairedPanel';
import CategoricalPanel from './analysis/CategoricalPanel';
import CorrelationPanel from './analysis/CorrelationPanel';
import RegressionPanel from './analysis/RegressionPanel';
import ReportPanel from './analysis/ReportPanel';
import { Select } from './analysis/ui';

const TABS = ['summary', 'quality', 'groups', 'paired', 'categorical', 'correlation', 'regression', 'visualize', 'report'];

function ShareBar({ columnTypes, config, onLoad }) {
    const { t } = useLanguage();
    const file = useRef(null);
    const [msg, setMsg] = useState('');
    const flash = text => { setMsg(text); setTimeout(() => setMsg(''), 2500); };
    const button = 'inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-700 border border-slate-200 hover:border-blue-300 bg-white rounded-lg px-3 py-1.5 transition-colors';
    return (
        <div className="flex flex-wrap items-center justify-center gap-2">
            <button type="button" className={button} onClick={() => downloadAnalysis(columnTypes, config)}><Save className="w-4 h-4" />{t.saveAnalysis}</button>
            <button type="button" className={button} onClick={() => file.current.click()}><Upload className="w-4 h-4" />{t.loadAnalysis}</button>
            <button type="button" className={button} onClick={async () => {
                const url = shareUrl(columnTypes, config);
                history.replaceState(null, '', url);
                try { await navigator.clipboard.writeText(url); flash(t.linkCopied); } catch { flash(url); }
            }}><Link2 className="w-4 h-4" />{t.copyLink}</button>
            <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={async e => {
                const f = e.target.files[0];
                e.target.value = '';
                if (!f) return;
                const parsed = parseShare(await f.text());
                if (parsed) { onLoad(parsed.config); flash(t.analysisLoaded); } else flash(t.loadError);
            }} />
            <span className="w-full text-center text-xs text-slate-400">{msg || t.shareNote}</span>
        </div>
    );
}

export default function AnalysisDashboard({ data, columnTypes, initialConfig }) {
    const { t } = useLanguage();
    const [config, setConfig] = useState(() => sanitizeConfig(initialConfig, columnTypes));
    const [activeTab, setActiveTab] = useState('summary');
    const groupingVariable = config.groupingVariable;

    const results = useMemo(() => runAll(data, columnTypes, config), [data, columnTypes, config]);
    const stats = useMemo(() => calculateStats(results.clean, columnTypes, groupingVariable), [results.clean, columnTypes, groupingVariable]);

    const columns = Object.keys(columnTypes);
    const numeric = columns.filter(c => isNumericType(columnTypes[c]));
    const categorical = columns.filter(c => isCategoricalType(columnTypes[c]));
    const panelProps = { data, columnTypes, config, setConfig, results, numeric, categorical, columns };

    const handleDownload = () => {
        const ws = XLSX.utils.json_to_sheet(stats);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Summary Statistics");
        XLSX.writeFile(wb, "Tabula_Analysis_Report.xlsx");
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            <div className="flex flex-col items-center gap-4 print:hidden">
                <div className="max-w-full overflow-x-auto">
                    <div role="tablist" className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex whitespace-nowrap">
                        {TABS.map(tab => (
                            <button
                                key={tab}
                                role="tab"
                                aria-selected={activeTab === tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                                    activeTab === tab
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                            >
                                {t[`tab_${tab}`]}
                            </button>
                        ))}
                    </div>
                </div>
                <ShareBar columnTypes={columnTypes} config={config} onLoad={cfg => setConfig(sanitizeConfig(cfg, columnTypes))} />
            </div>

            {activeTab === 'summary' && (
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">{t.resultsTitle}</h2>
                        <p className="text-slate-500 text-sm">{t.resultsDesc}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-slate-700">{t.groupingVariable}:</label>
                            <Select value={groupingVariable} onChange={v => setConfig(c => ({ ...c, groupingVariable: v }))} options={categorical} placeholder={t.noGrouping} />
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

            {activeTab === 'quality' && <QualityPanel {...panelProps} />}
            {activeTab === 'groups' && <GroupsPanel {...panelProps} />}
            {activeTab === 'paired' && <PairedPanel {...panelProps} />}
            {activeTab === 'categorical' && <CategoricalPanel {...panelProps} />}
            {activeTab === 'correlation' && <CorrelationPanel {...panelProps} />}
            {activeTab === 'regression' && <RegressionPanel {...panelProps} />}
            {activeTab === 'report' && <ReportPanel {...panelProps} />}

            {activeTab === 'visualize' && (
                <div className="h-[600px]">
                    <DataVisualization data={results.clean} columnTypes={columnTypes} />
                </div>
            )}

            {/* Contact Form Section */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-8 text-white text-center mt-12 relative overflow-hidden print:hidden">
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
