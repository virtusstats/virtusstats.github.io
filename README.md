# Tabula

Tabula (Latin for "table"; formerly Virtus Stats) is a browser-based statistics tool for a CSV or Excel file (live at https://virtusstats.github.io/).
Upload a file, mark each column as nominal, ordinal, interval or ratio, and Tabula runs the analysis
and writes the results in APA style. Turkish and English UI. Nothing is uploaded: the file is parsed
and analysed in the browser.

What it does, tab by tab:

- **Summary**: descriptives per column (mean, median, mode, quartiles, IQR, SD, min/max), Shapiro-Wilk normality
  (Jarque-Bera above 5000 values), Levene and the suggested test for a grouping variable.
- **Data quality**: missing values per column, outliers by the IQR rule or |z| > 3, and an "exclude" switch that
  treats a column's outliers as missing in every analysis.
- **Groups**: picks and runs the test (Student / Welch t, Mann-Whitney U, one-way / Welch ANOVA, Kruskal-Wallis)
  from normality per group and Levene, with effect sizes (d, r, η², ε²) and post-hoc tests when 3+ groups differ
  (Tukey HSD, Games-Howell, Dunn with Bonferroni).
- **Paired**: paired t-test or Wilcoxon signed-rank for before/after columns.
- **Categorical**: cross-tabulation, chi-square with expected counts and Cramér's V, Fisher's exact test for sparse 2×2 tables.
- **Correlation**: Pearson or Spearman matrix (automatic from normality) with p values, as a heat map.
- **Regression**: multiple linear or logistic regression on numeric predictors, with a prediction form.
- **Report**: everything as one APA-style document with numbered tables and result sentences; download as
  Word (.doc), print to PDF, export to Excel, or copy tables straight into a thesis.
- **Save / share**: the column types and settings (never the data) as a JSON file or a link (`#a=...`).

Every test is checked against R in `test/` (`npm test`). The statistics live in plain modules:
`src/utils/inference.js` (tests), `analyses.js` (which test for which columns), `apa.js` (APA strings and sentences).

```sh
npm install
npm run dev        # local
npm test           # statistics vs R reference values
npm run deploy     # build and publish dist/ to the gh-pages branch (the live site)
```

Pushing to `main` does not change the live site; only `npm run deploy` does.
`site/` is a separate one-page landing for the tool.
