import React from 'react';
import logo from '../assets/tabula-logo.svg';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

export default function Layout({ children }) {
    const { t, language, toggleLanguage } = useLanguage();

    return (
        <div className="min-h-screen flex flex-col font-sans text-slate-900 bg-slate-50">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50 bg-opacity-80 backdrop-blur-md">
                <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={logo} alt={t.brandName} className="h-9 w-auto" />
                    </div>
                    <nav className="flex items-center gap-6">
                        <button
                            onClick={toggleLanguage}
                            className="flex items-center gap-2 text-slate-600 hover:text-blue-700 transition-colors font-medium text-m"
                        >
                            <Globe className="w-4 h-4" />
                            {language === 'en' ? 'TR' : 'EN'}
                        </button>
                        <a href="https://virtusrnd.github.io/" className="text-slate-600 hover:text-blue-700 font-medium text-m transition-colors">
                            {t.contactSupport}
                        </a>
                    </nav>
                </div>
            </header>

            <main className="flex-grow container mx-auto px-4 py-8 relative">
                {children}
            </main>

            <footer className="bg-white border-t border-slate-200 py-8">
                <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} <a href="https://virtusrnd.github.io/">{t.footerRights}</a></p>
                </div>
            </footer>
        </div>
    );
}
