# Tabula

Tabula (Latin for "table"; formerly Virtus Stats) is browser-based descriptive statistics for a CSV or Excel file (live at https://virtusstats.github.io/).
Upload a file, mark each column as nominal, ordinal, interval or ratio, optionally pick a grouping
variable, and get per-column descriptives (mean, median, mode, quartiles, IQR, SD, min/max), a
Jarque-Bera normality p-value, Levene's test for equal variances across groups, a suggested
comparison test, and charts. Turkish and English UI. Nothing is uploaded: the file is parsed in the
browser.

```sh
npm install
npm run dev        # local
npm run deploy     # build and publish dist/ to the gh-pages branch (the live site)
```

Pushing to `main` does not change the live site; only `npm run deploy` does.
`site/` is a separate one-page landing for the tool.
