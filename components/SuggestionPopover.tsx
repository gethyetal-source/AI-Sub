import React, { useEffect, useRef, useState } from 'react';

interface SuggestionPopoverProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  onClose: () => void;
  targetRef: React.RefObject<HTMLElement>;
}

const SuggestionPopover: React.FC<SuggestionPopoverProps> = ({ suggestions, onSelect, onClose, targetRef }) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: -9999, left: -9999 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  useEffect(() => {
    if (targetRef.current) {
      const targetRect = targetRef.current.getBoundingClientRect();
      
      let top = targetRect.bottom + 5;
      let left = targetRect.left;

      // This is a placeholder for width/height as it's not rendered yet to measure
      const popoverEstWidth = 150; 
      const popoverEstHeight = 100;

      if (left + popoverEstWidth > window.innerWidth) {
        left = window.innerWidth - popoverEstWidth - 10;
      }
      if (top + popoverEstHeight > window.innerHeight) {
        top = targetRect.top - popoverEstHeight - 5;
      }
      if(top < 0) {
        top = 5;
      }

      setPosition({ top, left });
    }
  }, [targetRef]);


  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div
      ref={popoverRef}
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      className="fixed z-20 bg-slate-700 border border-slate-600 rounded-md shadow-lg py-1 text-sm min-w-[120px]"
    >
      <ul className="text-slate-200">
        {suggestions.map((suggestion) => (
          <li key={suggestion}>
            <button
              onClick={() => onSelect(suggestion)}
              className="w-full text-left px-3 py-1 hover:bg-sky-600 transition-colors"
            >
              {suggestion}
            </button>
          </li>
        ))}
         <li className="border-t border-slate-600 mt-1 pt-1">
            <button onClick={onClose} className="w-full text-left px-3 py-1 text-slate-400 hover:bg-slate-600">
                Ignore
            </button>
        </li>
      </ul>
    </div>
  );
};

export default SuggestionPopover;
