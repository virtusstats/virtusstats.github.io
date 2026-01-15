import * as ss from 'simple-statistics';

export function calculateStats(data, columnTypes) {
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
            normality: ''
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
