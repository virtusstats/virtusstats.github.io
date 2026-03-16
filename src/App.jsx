import React, { useState } from 'react';
import Layout from './components/Layout';
import FileUpload from './components/FileUpload';
import ColumnTypeSelector from './components/ColumnTypeSelector';
import AnalysisDashboard from './components/AnalysisDashboard';

import { useLanguage } from './context/LanguageContext';

function App() {
  const [data, setData] = useState(null);
  const [columnTypes, setColumnTypes] = useState({});
  const [step, setStep] = useState(0); // 0: Upload, 1: Define Columns, 2: Analyze

  const { t } = useLanguage();

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
            {t.heroTitle} <span className="text-blue-600">{t.heroTitleHighlight}</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {t.heroDesc}
          </p>
        </div>

        {step === 0 && (
          <div className="mt-8">
            <FileUpload onDataLoaded={(result) => {
              setData(result);
              setStep(1);
            }} />
          </div>
        )}

        {step === 1 && data && (
          <div className="mt-8">
            <ColumnTypeSelector
              data={data.data}
              headers={data.headers}
              onConfirm={(types) => {
                setColumnTypes(types);
                setStep(2);
              }}
            />
          </div>
        )}

        {step === 2 && (
          <div className="mt-8">
            <AnalysisDashboard data={data.data} columnTypes={columnTypes} />

            <div className="mt-8 text-center pb-8">
              <button
                onClick={() => setStep(0)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
              >
                {t.startOver}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default App;
