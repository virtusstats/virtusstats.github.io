import * as ss from 'simple-statistics';
import { normality, compareGroups } from './analyses.js';

export function calculateStats(data, columnTypes, groupingVariable = '') {
    const stats = [];
    const headers = Object.keys(columnTypes);

    headers.forEach(header => {
        const type = columnTypes[header];
        const values = data.map(row => row[header]);

        const result = {
            variable: header,
            type: type,
            count: values.length,
            missing: values.filter(v => v === null || v === undefined || v === '').length,
            mean: '',
            median: '',
            mode: '',
            q1: '',
            q3: '',
            iqr: '',
            stdDev: '',
            min: '',
            max: '',
            pValue: '',
            isNormal: '',
            normality: '',
            isHomogeneous: '-',
            homogeneity: '-',
            recommendedTest: '-'
        };

        if (type === 'ratio' || type === 'interval') {
            const numericValues = values
                .filter(v => v !== null && v !== undefined && v !== '' && !isNaN(Number(v)))
                .map(v => Number(v))
                .sort((a, b) => a - b);

            if (numericValues.length > 0) {
                result.mean = ss.mean(numericValues).toFixed(2);
                result.median = ss.median(numericValues).toFixed(2);
                result.min = ss.min(numericValues).toFixed(2);
                result.max = ss.max(numericValues).toFixed(2);

                try {
                    result.mode = ss.mode(numericValues).toFixed(2);
                } catch (e) {
                    result.mode = "Multimodal";
                }

                if (numericValues.length > 1) {
                    result.stdDev = ss.standardDeviation(numericValues).toFixed(2);
                    result.q1 = ss.quantile(numericValues, 0.25).toFixed(2);
                    result.q3 = ss.quantile(numericValues, 0.75).toFixed(2);
                    result.iqr = ss.interquartileRange(numericValues).toFixed(2);

                    // Normality: Shapiro-Wilk (Jarque-Bera above 5000 values). H0 is normality, so p < 0.05 means NOT normal.
                    const norm = normality(numericValues);
                    if (norm) {
                        result.pValue = norm.p.toFixed(4);
                        result.isNormal = norm.normal ? "Yes" : "No";
                        result.normality = `p=${norm.p.toFixed(4)}`;
                    } else {
                        result.pValue = numericValues.length < 3 ? "N<3" : "-";
                        result.isNormal = "N/A";
                    }

                    // Levene and the suggested test come from the same group comparison the Groups tab runs.
                    if (groupingVariable && columnTypes[groupingVariable]) {
                        const cmp = compareGroups(data, header, groupingVariable);
                        if (cmp.error) {
                            result.isHomogeneous = "N/A";
                            result.homogeneity = cmp.error === 'needTwoGroups' ? "Need 2+ groups" : "Not enough data";
                        } else {
                            result.homogeneity = `p=${cmp.levene.p.toFixed(4)}`;
                            result.isHomogeneous = cmp.equalVar ? "Yes" : "No";
                            result.recommendedTest = cmp.result.test;
                        }
                    }
                }
            }
        } else {
            // Nominal/Ordinal Mode
            const validValues = values.filter(v => v !== null && v !== undefined && v !== '');
            if (validValues.length > 0) {
                const counts = {};
                let maxCount = 0;
                let modeVal = '-';
                validValues.forEach(v => {
                    const str = String(v);
                    counts[str] = (counts[str] || 0) + 1;
                    if (counts[str] > maxCount) {
                        maxCount = counts[str];
                        modeVal = str;
                    }
                });
                result.mode = modeVal;
            }
        }

        stats.push(result);
    });

    return stats;
}
