
export interface SubtitleEntry {
  startTime: number;
  endTime: number;
  text: string;
}

export interface SpellCheckResult {
  word: string;
  suggestions: string[];
}
