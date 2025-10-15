
import React from 'react';

const FilmIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
  </svg>
);

const Header: React.FC = () => {
  return (
    <header className="bg-slate-900/80 backdrop-blur-sm shadow-lg py-4 border-b border-slate-700/50 sticky top-0 z-10">
      <div className="container mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-3">
          <FilmIcon className="text-sky-400 h-8 w-8" />
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">
            AI Video Subtitle Generator
          </h1>
        </div>
        <p className="text-slate-400 mt-1">Generate, Translate & Edit Subtitles with Gemini</p>
      </div>
    </header>
  );
};

export default Header;
