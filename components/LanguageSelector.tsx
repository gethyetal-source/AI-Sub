
import React from 'react';
import { LANGUAGES } from '../constants';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedLanguage, onLanguageChange }) => {
  return (
    <div className="w-full sm:w-auto flex-grow">
      <label htmlFor="language-select" className="block text-sm font-medium text-slate-300 mb-1">
        Translate to:
      </label>
      <select
        id="language-select"
        value={selectedLanguage}
        onChange={(e) => onLanguageChange(e.target.value)}
        className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-2 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>
            {lang}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
