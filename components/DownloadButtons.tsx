
import React from 'react';
import { SubtitleEntry } from '../types';
import { toSrt, toVtt } from '../services/subtitleService';

interface DownloadButtonsProps {
  subtitles: SubtitleEntry[];
  videoFileName: string;
}

const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);


const DownloadButtons: React.FC<DownloadButtonsProps> = ({ subtitles, videoFileName }) => {
  const handleDownload = (format: 'srt' | 'vtt') => {
    const content = format === 'srt' ? toSrt(subtitles) : toVtt(subtitles);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = videoFileName.substring(0, videoFileName.lastIndexOf('.'));
    a.download = `${baseName}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
       <h2 className="text-2xl font-bold text-sky-400 mb-4">Download Subtitles</h2>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => handleDownload('srt')}
          className="flex-1 flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
        >
          <DownloadIcon />
          Download .SRT
        </button>
        <button
          onClick={() => handleDownload('vtt')}
          className="flex-1 flex items-center justify-center bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
        >
          <DownloadIcon />
          Download .VTT
        </button>
      </div>
    </div>
  );
};

export default DownloadButtons;
