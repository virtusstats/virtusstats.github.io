import * as ss from 'simple-statistics';
import { jStat } from 'jstat';

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

                    // Formal Normality Test: Jarque-Bera
                    // Robust, no dependencies, calculates P-value based on Skewness and Kurtosis
                    // JB = (n/6) * (S^2 + (1/4)*(K-3)^2)
                    // Note: simple-statistics sampleKurtosis returns "excess kurtosis" directly or raw?
                    // Docs: sampleKurtosis gives excess kurtosis? No, usually libraries give regular kurtosis.
                    // Implementation of ss.sampleKurtosis: "This calculates the excess kurtosis."
                    // If it is excess kurtosis, then we use (K)^2 directly (since K-3 is already done).
                    // Wait, let's verify standard definition. JB uses (K-3)^2 where K is raw moment. 
                    // Excess kurtosis IS K-3. So if ss gives excess, we just square it.

                    if (numericValues.length >= 3) {
                        try {
                            const n = numericValues.length;
                            const s = ss.sampleSkewness(numericValues);
                            const k = ss.sampleKurtosis(numericValues); // Excess kurtosis

                            const jb = (n / 6) * (Math.pow(s, 2) + 0.25 * Math.pow(k, 2));

                            // P-value for Chi-Square with 2 degrees of freedom
                            // P = exp(-JB / 2)
                            const pValue = Math.exp(-jb / 2);

                            result.pValue = pValue.toFixed(4);

                            // User Request: "p değeri 0.05 ten küçükse normal dağılsın"
                            // Translates to: If p < 0.05, then Normal = Yes.
                            // (Note: This is inverse of standard JB/SW test logic where p < 0.05 means reject null hypothesis of normality).
                            result.isNormal = pValue < 0.05 ? "Yes" : "No";
                            result.normality = `p=${pValue.toFixed(4)}`; // (JB=${jb.toFixed(2)})

                        } catch (err) {
                            console.error("JB Test error:", err);
                            result.isNormal = "Error";
                        }
                    } else {
                        result.pValue = "N<3";
                        result.isNormal = "N/A";
                    }

                    // Levene's Test for Homogeneity of Variances
                    if (groupingVariable && columnTypes[groupingVariable]) {
                        // Extract paired valid data: [Value, Group] 
                        // Exclude rows where either target or group is missing/invalid
                        let validPairs = [];
                        for (let i = 0; i < data.length; i++) {
                            const v = data[i][header];
                            const g = data[i][groupingVariable];
                            if (v !== null && v !== undefined && v !== '' && !isNaN(Number(v)) && g !== null && g !== undefined && g !== '') {
                                validPairs.push({ val: Number(v), group: String(g) });
                            }
                        }

                        // Group the values
                        const groups = {};
                        validPairs.forEach(pair => {
                            if (!groups[pair.group]) groups[pair.group] = [];
                            groups[pair.group].push(pair.val);
                        });

                        const groupNames = Object.keys(groups);
                        const k = groupNames.length;
                        const N = validPairs.length;

                        if (k >= 2 && N > k) {
                            try {
                                // 1. Calculate the mean for each group
                                const groupMeans = {};
                                groupNames.forEach(g => {
                                    groupMeans[g] = ss.mean(groups[g]);
                                });

                                // 2. Compute absolute deviations (Z_ij)
                                const Z = {};
                                let globalZSum = 0;
                                let globalZCount = 0;
                                groupNames.forEach(g => {
                                    Z[g] = groups[g].map(val => Math.abs(val - groupMeans[g]));
                                    globalZSum += ss.sum(Z[g]);
                                    globalZCount += Z[g].length;
                                });

                                const globalZMean = globalZSum / globalZCount;

                                // 3. Compute W (F-statistic for One-Way ANOVA on Z_ij)
                                let SSTR = 0; // Treatment Sum of Squares
                                let SSE = 0;  // Error Sum of Squares

                                groupNames.forEach(g => {
                                    const n_i = Z[g].length;
                                    const mean_Z_i = ss.mean(Z[g]);
                                    
                                    SSTR += n_i * Math.pow(mean_Z_i - globalZMean, 2);

                                    Z[g].forEach(z_ij => {
                                        SSE += Math.pow(z_ij - mean_Z_i, 2);
                                    });
                                });

                                const df1 = k - 1;
                                const df2 = N - k;

                                const MSTR = SSTR / df1;
                                const MSE = SSE / df2;

                                const W = MSTR / MSE;

                                // 4. Compute P-value using F-distribution
                                // jStat.centralF.cdf(x, df1, df2) gives P(X <= x)
                                // We want the upper tail P(X > x)
                                const pValLevene = 1 - jStat.centralF.cdf(W, df1, df2);

                                result.homogeneity = `p=${pValLevene.toFixed(4)}`;
                                result.isHomogeneous = pValLevene < 0.05 ? "No" : "Yes"; // p < 0.05 -> variances are NOT equal

                                // Recommendation Logic
                                const normal = result.isNormal === "Yes" || result.isNormal === "Yes (Approx)";
                                const homog = result.isHomogeneous === "Yes";
                                
                                if (k === 2) {
                                    if (normal) {
                                        result.recommendedTest = homog ? "indTTest" : "welchTTest";
                                    } else {
                                        result.recommendedTest = "mannWhitneyU";
                                    }
                                } else if (k > 2) {
                                    if (normal) {
                                        result.recommendedTest = homog ? "oneWayAnova" : "welchAnova";
                                    } else {
                                        result.recommendedTest = "kruskalWallis";
                                    }
                                }

                            } catch (err) {
                                console.error("Levene's Test error:", err);
                                result.isHomogeneous = "Error";
                                result.homogeneity = "Error";
                                result.recommendedTest = "Error"
                            }
                        } else {
                            result.isHomogeneous = "N/A";
                            result.homogeneity = k < 2 ? "Need 2+ groups" : "Not enough data";
                            result.recommendedTest = "-"
                        }
                    } else {
                        // No grouping variable selected
                        result.isHomogeneous = "-";
                        result.homogeneity = "-";
                        result.recommendedTest = "-"
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
