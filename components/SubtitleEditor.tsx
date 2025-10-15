import React, { useEffect, useRef } from 'react';
import { SubtitleEntry } from '../types';

interface SubtitleEditorProps {
  subtitles: SubtitleEntry[];
  onSubtitleChange: (index: number, newText: string) => void;
  currentTime: number;
  onSeek: (time: number) => void;
}

const formatTime = (seconds: number): string => {
  const date = new Date(0);
  date.setSeconds(seconds);
  return date.toISOString().substr(11, 8);
};

const SubtitleEditor: React.FC<SubtitleEditorProps> = ({ subtitles, onSubtitleChange, currentTime, onSeek }) => {
  const activeIndex = subtitles.findIndex(s => currentTime >= s.startTime && currentTime <= s.endTime);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Ensure refs array is in sync with subtitles array
  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, subtitles.length);
  }, [subtitles]);

  // Scroll to active subtitle
  useEffect(() => {
    if (activeIndex !== -1 && itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-sky-400 mb-4">Subtitle Editor</h2>
      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 bg-slate-900/50 p-4 rounded-lg">
        {subtitles.map((entry, index) => {
          const isActive = index === activeIndex;
          const activeClasses = isActive ? 'bg-sky-900/50 ring-2 ring-sky-500' : 'bg-slate-800 hover:bg-slate-700/50';

          return (
            <div
              key={index}
              ref={el => { itemRefs.current[index] = el; }}
              onClick={() => onSeek(entry.startTime)}
              className={`grid grid-cols-1 md:grid-cols-[150px_1fr] gap-2 md:gap-4 items-center p-3 rounded-md cursor-pointer transition-all duration-200 ${activeClasses}`}
              aria-current={isActive ? 'true' : 'false'}
            >
              <div className="font-mono text-sm text-slate-400 text-center md:text-left">
                {formatTime(entry.startTime)} &rarr; {formatTime(entry.endTime)}
              </div>
              <textarea
                value={entry.text}
                onClick={(e) => e.stopPropagation()} // Prevent seek when clicking textarea
                onChange={(e) => onSubtitleChange(index, e.target.value)}
                className="w-full bg-slate-700 text-slate-200 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition resize-none"
                rows={2}
                aria-label={`Subtitle text for time ${formatTime(entry.startTime)}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubtitleEditor;
