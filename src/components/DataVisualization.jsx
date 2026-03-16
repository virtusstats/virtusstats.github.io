import React, { useMemo, useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import * as ss from 'simple-statistics';
import { Download } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const CustomBoxPlot = (props) => {
    const { x, y, width, height, payload } = props;
    const { min, q1, median, q3, max, outliers, overallMin, overallMax } = payload;
    
    // The bar rendered by Recharts has 'y' at overallMax, and 'height' spanning down to overallMin.
    const range = overallMax - overallMin;
    const unit = range !== 0 ? height / range : 0;
    
    const getY = (val) => y + (overallMax - val) * unit;

    const yQ3 = getY(q3);
    const yQ1 = getY(q1);
    const yMed = getY(median);
    const yWhiskMax = getY(max); 
    const yWhiskMin = getY(min); 

    const centerX = x + width / 2;
    const whiskerWidth = width * 0.5;

    return (
        <g>
            {unit > 0 && (
                <>
                {/* Whiskers */}
                <line x1={centerX} y1={yQ3} x2={centerX} y2={yWhiskMax} stroke="#3b82f6" strokeWidth={2} />
                <line x1={centerX} y1={yQ1} x2={centerX} y2={yWhiskMin} stroke="#3b82f6" strokeWidth={2} />
                {/* Ticks */}
                <line x1={centerX - whiskerWidth/2} y1={yWhiskMax} x2={centerX + whiskerWidth/2} y2={yWhiskMax} stroke="#3b82f6" strokeWidth={2} />
                <line x1={centerX - whiskerWidth/2} y1={yWhiskMin} x2={centerX + whiskerWidth/2} y2={yWhiskMin} stroke="#3b82f6" strokeWidth={2} />
                </>
            )}
            
            {/* Box */}
            <rect x={x} y={yQ3} width={width} height={Math.max(yQ1 - yQ3, 2)} fill="#93c5fd" fillOpacity={0.8} stroke="#3b82f6" strokeWidth={2} />
            
            {/* Median Line */}
            {unit > 0 && (
                <line x1={x} y1={yMed} x2={x + width} y2={yMed} stroke="#1d4ed8" strokeWidth={3} />
            )}

            {/* Outliers */}
            {unit > 0 && outliers && outliers.map((outlier, idx) => (
                <circle key={`outlier-${idx}`} cx={centerX} cy={getY(outlier)} r={4} fill="#ef4444" opacity={0.6} title={`Outlier: ${outlier}`} />
            ))}
        </g>
    );
};

export default function DataVisualization({ data, columnTypes }) {
    const { t } = useLanguage();
    const headers = Object.keys(columnTypes);
    const numericHeaders = headers.filter(h => columnTypes[h] === 'interval' || columnTypes[h] === 'ratio');
    
    const [selectedVar, setSelectedVar] = useState(headers[0] || '');
    const [chartType, setChartType] = useState('bar'); // default to bar
    const [numericYVar, setNumericYVar] = useState(numericHeaders[0] || '');
    const chartRef = useRef(null);

    const chartData = useMemo(() => {
        if (!selectedVar) return [];

        const type = columnTypes[selectedVar];
        const rawValues = data.map(row => row[selectedVar]).filter(v => v !== null && v !== undefined && v !== '');

        if (type === 'nominal' || type === 'ordinal') {
            if (chartType === 'boxplot') {
                if (!numericYVar) return [];
                
                // Group data by selectedVar
                const grouped = {};
                data.forEach(row => {
                    const catVal = String(row[selectedVar]);
                    const numVal = Number(row[numericYVar]);
                    if (!isNaN(numVal) && row[selectedVar] !== null && row[selectedVar] !== undefined && row[selectedVar] !== '') {
                        if (!grouped[catVal]) grouped[catVal] = [];
                        grouped[catVal].push(numVal);
                    }
                });

                let globalMin = Infinity;
                let globalMax = -Infinity;

                const groupStats = Object.keys(grouped).map(cat => {
                    const vals = grouped[cat].sort((a,b) => a-b);
                    if (vals.length === 0) return null;
                    
                    const q1 = ss.quantileSorted(vals, 0.25);
                    const med = ss.medianSorted(vals);
                    const q3 = ss.quantileSorted(vals, 0.75);
                    const iqr = q3 - q1;
                    const lf = q1 - 1.5 * iqr;
                    const uf = q3 + 1.5 * iqr;
                    
                    const nonOut = vals.filter(v => v >= lf && v <= uf);
                    const out = vals.filter(v => v < lf || v > uf);
                    const wMin = nonOut.length > 0 ? ss.min(nonOut) : q1;
                    const wMax = nonOut.length > 0 ? ss.max(nonOut) : q3;
                    const cMin = ss.min(vals);
                    const cMax = ss.max(vals);

                    if (cMin < globalMin) globalMin = cMin;
                    if (cMax > globalMax) globalMax = cMax;

                    return {
                        name: cat,
                        min: wMin, q1, median: med, q3, max: wMax,
                        outliers: out,
                        overallMin: cMin, // overwritten later so all bars share scale
                        overallMax: cMax, // overwritten later so all bars share scale
                    };
                }).filter(Boolean);

                return groupStats.map(stat => ({
                    ...stat,
                    overallMin: globalMin,
                    overallMax: globalMax,
                    box: [globalMin, globalMax]
                }));
            }

            // Frequency counting for Categorical Data
            const counts = {};
            rawValues.forEach(val => {
                const key = String(val);
                counts[key] = (counts[key] || 0) + 1;
            });
            
            return Object.keys(counts).map(key => ({
                name: key,
                count: counts[key]
            })).sort((a, b) => b.count - a.count); // Sort by highest frequency

        } else if (type === 'interval' || type === 'ratio') {
            const numericValues = rawValues.map(v => Number(v)).filter(v => !isNaN(v));
            if (numericValues.length === 0) return [];
            
            if (chartType === 'boxplot') {
                const sorted = numericValues.sort((a,b) => a-b);
                const overallMin = ss.min(sorted);
                const overallMax = ss.max(sorted);
                const q1Val = ss.quantileSorted(sorted, 0.25);
                const medVal = ss.medianSorted(sorted);
                const q3Val = ss.quantileSorted(sorted, 0.75);
                
                const iqr = q3Val - q1Val;
                const lowerFence = q1Val - 1.5 * iqr;
                const upperFence = q3Val + 1.5 * iqr;
                
                const nonOutliers = sorted.filter(v => v >= lowerFence && v <= upperFence);
                const outliers = sorted.filter(v => v < lowerFence || v > upperFence);
                
                const whiskerMin = nonOutliers.length > 0 ? ss.min(nonOutliers) : q1Val;
                const whiskerMax = nonOutliers.length > 0 ? ss.max(nonOutliers) : q3Val;
                
                return [{
                    name: selectedVar,
                    min: whiskerMin,
                    q1: q1Val,
                    median: medVal,
                    q3: q3Val,
                    max: whiskerMax,
                    outliers: outliers,
                    overallMin: overallMin,
                    overallMax: overallMax,
                    box: [overallMin, overallMax] // Hack for Recharts to scale Y axis based on actual min/max
                }];
            }

            // Normal Binning for continuous vs other charts (Histograms/Lines)

            const min = ss.min(numericValues);
            const max = ss.max(numericValues);
            
            // Determine number of bins (Sturges' formula)
            const numBins = Math.max(5, Math.ceil(1 + 3.322 * Math.log10(numericValues.length)));
            const binSize = (max - min) / numBins;

            if (binSize === 0) {
                return [{ name: String(min), count: numericValues.length }];
            }

            // Initialize bins
            const bins = Array.from({ length: numBins }, (_, i) => ({
                min: min + i * binSize,
                max: min + (i + 1) * binSize,
                count: 0
            }));

            // Assign values to bins
            numericValues.forEach(val => {
                let placed = false;
                for (let i = 0; i < numBins; i++) {
                    // Include in current bin if val < max, or if it's the absolute max value and we are in the last bin
                    if (val >= bins[i].min && (val < bins[i].max || (i === numBins - 1 && val <= bins[i].max))) {
                        bins[i].count++;
                        placed = true;
                        break;
                    }
                }
                if (!placed && val === max) {
                    bins[numBins-1].count++;
                }
            });

            return bins.map(bin => ({
                name: `${bin.min.toFixed(1)} - ${bin.max.toFixed(1)}`,
                count: bin.count
            }));
        }
        return [];
    }, [data, columnTypes, selectedVar, chartType, numericYVar]);

    const isCategorical = columnTypes[selectedVar] === 'nominal' || columnTypes[selectedVar] === 'ordinal';

    // Auto-switch default chart type when variable changes
    React.useEffect(() => {
        if (isCategorical) {
            if (chartType === 'area' || chartType === 'line') {
                setChartType('bar');
            }
        } else {
            setChartType('boxplot');
        }
    }, [selectedVar, isCategorical]);

    const handleDownload = () => {
        if (!chartRef.current) return;
        
        // Find the recharts SVG
        const svgElement = chartRef.current.querySelector('svg');
        if (!svgElement) {
            console.error('No SVG found');
            return;
        }

        // Clone it so we can modify background without affecting UI
        const clone = svgElement.cloneNode(true);
        
        // Serialize to string
        const svgData = new XMLSerializer().serializeToString(clone);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Use exact dimensions
        const width = svgElement.clientWidth || 800;
        const height = svgElement.clientHeight || 400;
        canvas.width = width;
        canvas.height = height;

        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            // Fill white background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            
            // Draw SVG
            ctx.drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(url);

            // Export 
            const imgURI = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `${selectedVar}_${chartType}_chart.png`;
            link.href = imgURI;
            link.click();
        };
        img.onerror = (err) => {
            console.error('Error drawing SVG to canvas:', err);
        };
        img.src = url;
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden h-full flex flex-col relative">
            <div className="p-6 border-b border-slate-100 flex flex-col gap-6">
                <div className="flex items-center justify-between w-full">
                    <h2 className="text-2xl font-bold text-slate-800">{t.dataVisTitle}</h2>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium"
                        title={t.downloadChart}
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden md:inline">{t.downloadChart}</span>
                    </button>
                </div>
                
                <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4 w-full">
                    <div className="flex items-center gap-2 w-full xl:w-auto">
                        <label className="text-sm font-medium text-slate-700 whitespace-nowrap">{t.selectVarToVis}</label>
                        <select
                            value={selectedVar}
                            onChange={(e) => setSelectedVar(e.target.value)}
                            className="w-full xl:w-40 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="" disabled>{t.selectVarToVis}</option>
                            {headers.map(header => (
                                <option key={header} value={header}>{header}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 w-full xl:w-auto">
                        <label className="text-sm font-medium text-slate-700 whitespace-nowrap">{t.chartTypeLabel}</label>
                        <select
                            value={chartType}
                            onChange={(e) => setChartType(e.target.value)}
                            className="w-full xl:w-40 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            {isCategorical ? (
                                <>
                                    <option value="bar">{t.barChart}</option>
                                    <option value="boxplot">{t.boxplot}</option>
                                    <option value="pie">{t.pieChart}</option>
                                </>
                            ) : (
                                <>
                                    <option value="boxplot">{t.boxplot}</option>
                                    <option value="area">{t.areaChart}</option>
                                    <option value="bar">{t.barChart}</option>
                                    <option value="line">{t.lineChart}</option>
                                    <option value="pie">{t.pieChart}</option>
                                </>
                            )}
                        </select>
                    </div>

                    {isCategorical && chartType === 'boxplot' && (
                        <div className="flex items-center gap-2 w-full xl:w-auto">
                            <label className="text-sm font-medium text-slate-700 whitespace-nowrap">{t.selectNumericVar}</label>
                            <select
                                value={numericYVar}
                                onChange={(e) => setNumericYVar(e.target.value)}
                                className="w-full xl:w-40 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                {numericHeaders.map(header => (
                                    <option key={header} value={header}>{header}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-6 flex-grow min-h-[400px]" ref={chartRef}>
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'boxplot' && (
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis 
                                    dataKey="name" 
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={{ stroke: '#cbd5e1' }}
                                />
                                <YAxis 
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={['auto', 'auto']}
                                />
                                <Tooltip 
                                    cursor={{fill: '#f1f5f9'}}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg">
                                                    <p className="font-semibold text-slate-800 mb-2">{data.name}</p>
                                                    <p className="text-xs text-slate-600">Min: <span className="font-medium">{data.min.toFixed(2)}</span></p>
                                                    <p className="text-xs text-slate-600">Q1: <span className="font-medium">{data.q1.toFixed(2)}</span></p>
                                                    <p className="text-xs text-slate-600">Median: <span className="font-medium">{data.median.toFixed(2)}</span></p>
                                                    <p className="text-xs text-slate-600">Q3: <span className="font-medium">{data.q3.toFixed(2)}</span></p>
                                                    <p className="text-xs text-slate-600">Max: <span className="font-medium">{data.max.toFixed(2)}</span></p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="box" shape={<CustomBoxPlot />} isAnimationActive={false} />
                            </BarChart>
                        )}
                        {chartType === 'bar' && (
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis 
                                    dataKey="name" 
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={{ stroke: '#cbd5e1' }}
                                />
                                <YAxis 
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip 
                                    cursor={{fill: '#f1f5f9'}}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="count" name={t.frequency} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        )}
                        {chartType === 'area' && (
                            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis 
                                    dataKey="name" 
                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                    tickLine={false}
                                    axisLine={{ stroke: '#cbd5e1' }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={60}
                                />
                                <YAxis 
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="count" name={t.frequency} stroke="#3b82f6" fill="#93c5fd" fillOpacity={0.5} />
                            </AreaChart>
                        )}
                        {chartType === 'line' && (
                            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis 
                                    dataKey="name" 
                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                    tickLine={false}
                                    axisLine={{ stroke: '#cbd5e1' }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={60}
                                />
                                <YAxis 
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line type="monotone" dataKey="count" name={t.frequency} stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        )}
                        {chartType === 'pie' && (
                            <PieChart margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={true}
                                    outerRadius={150}
                                    fill="#8884d8"
                                    dataKey="count"
                                    nameKey="name"
                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        )}
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-400">
                        No Data Available
                    </div>
                )}
            </div>
        </div>
    );
}
