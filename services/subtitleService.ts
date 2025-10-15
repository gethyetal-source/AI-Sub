
import { SubtitleEntry } from "../types";

const formatTimestamp = (seconds: number, format: 'srt' | 'vtt'): string => {
  const date = new Date(0);
  date.setUTCSeconds(seconds);
  const isoString = date.toISOString(); // Format: YYYY-MM-DDTHH:mm:ss.sssZ

  const hours = isoString.substr(11, 2);
  const minutes = isoString.substr(14, 2);
  const secs = isoString.substr(17, 2);
  const ms = isoString.substr(20, 3);
  
  const separator = format === 'srt' ? ',' : '.';
  
  return `${hours}:${minutes}:${secs}${separator}${ms}`;
};

export const toSrt = (subtitles: SubtitleEntry[]): string => {
  return subtitles
    .map((entry, index) => {
      const startTime = formatTimestamp(entry.startTime, 'srt');
      const endTime = formatTimestamp(entry.endTime, 'srt');
      return `${index + 1}\n${startTime} --> ${endTime}\n${entry.text}\n`;
    })
    .join('\n');
};

export const toVtt = (subtitles: SubtitleEntry[]): string => {
  const header = 'WEBVTT\n\n';
  const body = subtitles
    .map((entry) => {
      const startTime = formatTimestamp(entry.startTime, 'vtt');
      const endTime = formatTimestamp(entry.endTime, 'vtt');
      return `${startTime} --> ${endTime}\n${entry.text}\n`;
    })
    .join('\n');
  return header + body;
};
