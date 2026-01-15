import React from 'react';
import logo from '../assets/logo.png';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

export default function Layout({ children }) {
    const { t, language, toggleLanguage } = useLanguage();

    return (
        <div className="min-h-screen flex flex-col font-sans text-slate-900 bg-slate-50">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50 bg-opacity-80 backdrop-blur-md">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={logo} alt="VirtusStat Logo" className="h-10 w-auto" />
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-700 to-slate-700 bg-clip-text text-transparent">
                            {t.brandName}
                        </span>
                    </div>
                    <nav className="flex items-center gap-6">
                        <button
                            onClick={toggleLanguage}
                            className="flex items-center gap-2 text-slate-600 hover:text-blue-700 transition-colors font-medium text-sm"
                        >
                            <Globe className="w-4 h-4" />
                            {language === 'en' ? 'TR' : 'EN'}
                        </button>
                        <a href="#" className="text-slate-600 hover:text-blue-700 font-medium transition-colors">
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
                    <p>&copy; {new Date().getFullYear()} {t.footerRights}</p>
                </div>
            </footer>
        </div>
    );
}
