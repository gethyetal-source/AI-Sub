import React, { useState, useEffect, useRef } from 'react';
import { SubtitleEntry, SpellCheckResult } from '../types';
import { checkSpelling } from '../services/geminiService';
import SuggestionPopover from './SuggestionPopover';

// A simple debounce hook
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};


interface SubtitleLineProps {
  entry: SubtitleEntry;
  index: number;
  onSubtitleChange: (index: number, newText: string) => void;
}

interface ActiveSuggestion {
  word: string;
  wordIndex: number;
  suggestions: string[];
  targetRef: React.RefObject<HTMLSpanElement>;
}

const SubtitleLine: React.FC<SubtitleLineProps> = ({ entry, index, onSubtitleChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [spellCheckResults, setSpellCheckResults] = useState<Record<string, string[]>>({});
  const [activeSuggestion, setActiveSuggestion] = useState<ActiveSuggestion | null>(null);
  
  const wordRefs = useRef<Map<string, React.RefObject<HTMLSpanElement>>>(new Map());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const debouncedText = useDebounce(entry.text, 750);

  useEffect(() => {
    let isCancelled = false;
    
    // Clear previous refs when text changes
    wordRefs.current.clear();

    const performSpellCheck = async () => {
      if (!debouncedText || isEditing) {
        setSpellCheckResults({});
        return;
      }
      const results: SpellCheckResult[] = await checkSpelling(debouncedText);
      if (!isCancelled) {
        const resultsMap = results.reduce((acc, { word, suggestions }) => {
          acc[word] = suggestions;
          return acc;
        }, {} as Record<string, string[]>);
        setSpellCheckResults(resultsMap);
      }
    };

    performSpellCheck();

    return () => {
      isCancelled = true;
    };
  }, [debouncedText, isEditing]);
  
  useEffect(() => {
    if (isEditing && textareaRef.current) {
        textareaRef.current.focus();
        // Move cursor to end
        textareaRef.current.selectionStart = textareaRef.current.value.length;
        textareaRef.current.selectionEnd = textareaRef.current.value.length;
    }
  }, [isEditing]);

  const handleWordClick = (e: React.MouseEvent, word: string, wordIndex: number) => {
      e.stopPropagation(); // Prevent seek
      const suggestions = spellCheckResults[word];
      if (suggestions && suggestions.length > 0) {
        const refKey = `${wordIndex}`;
        const targetRef = wordRefs.current.get(refKey);
        if(targetRef){
            setActiveSuggestion({ word, wordIndex, suggestions, targetRef });
        }
      }
  };
  
  const handleSuggestionSelect = (suggestion: string) => {
    if (!activeSuggestion) return;
    
    // Split text into words/whitespace to accurately replace the Nth occurrence
    const parts = entry.text.split(/(\s+)/);
    let currentWordIndex = 0;
    const newParts = parts.map(part => {
        const isWord = !/^\s+$/.test(part) && part.length > 0;
        if (isWord) {
            const wordIndex = currentWordIndex;
            currentWordIndex++;
            if (part === activeSuggestion.word && wordIndex === activeSuggestion.wordIndex) {
                return suggestion;
            }
        }
        return part;
    });

    onSubtitleChange(index, newParts.join(''));
    setActiveSuggestion(null);
  };
  
  const renderTextWithHighlights = () => {
    const parts = entry.text.split(/(\s+)/);
    let wordIndexCounter = 0;
    
    return parts.map((part, i) => {
      const isWord = !/^\s+$/.test(part) && part.length > 0;
      if (isWord) {
        const word = part;
        const currentWordIndex = wordIndexCounter;
        const isMisspelled = Object.keys(spellCheckResults).includes(word);
        
        const refKey = `${currentWordIndex}`;
        if (!wordRefs.current.has(refKey)) {
            wordRefs.current.set(refKey, React.createRef());
        }
        const ref = wordRefs.current.get(refKey)!;
        wordIndexCounter++;
        
        return (
          <span
            key={i}
            ref={ref}
            className={isMisspelled ? 'underline decoration-red-500 decoration-wavy cursor-pointer' : ''}
            onClick={(e) => isMisspelled && handleWordClick(e, word, currentWordIndex)}
          >
            {word}
          </span>
        );
      }
      return <span key={i}>{part}</span>; // Render whitespace
    });
  };

  return (
    <div className="relative w-full" onClick={(e) => e.stopPropagation()}>
      {isEditing ? (
        <textarea
            ref={textareaRef}
            value={entry.text}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onSubtitleChange(index, e.target.value)}
            onBlur={() => setIsEditing(false)}
            className="w-full bg-slate-700 text-slate-200 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition resize-none"
            rows={2}
            aria-label={`Subtitle text for time ${entry.startTime}`}
        />
      ) : (
         <div 
            onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
            }}
            className="w-full bg-slate-700/50 text-slate-200 border border-transparent rounded-md p-2 min-h-[4rem] cursor-text"
          >
            {entry.text ? renderTextWithHighlights() : <span className="text-slate-500">Click to edit...</span>}
         </div>
      )}
       {activeSuggestion && (
        <SuggestionPopover
            suggestions={activeSuggestion.suggestions}
            onSelect={handleSuggestionSelect}
            onClose={() => setActiveSuggestion(null)}
            targetRef={activeSuggestion.targetRef}
        />
      )}
    </div>
  );
};

export default SubtitleLine;
