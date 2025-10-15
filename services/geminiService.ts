import { GoogleGenAI, Type } from "@google/genai";
import { SubtitleEntry } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- Helper Functions for Audio Processing ---

/**
 * Gets the duration of a video file in seconds.
 */
const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = reject;
    video.src = window.URL.createObjectURL(file);
  });
};


/**
 * Converts an AudioBuffer to a base64 encoded WAV file string.
 */
const audioBufferToWavBase64 = (buffer: AudioBuffer): string => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArr = new ArrayBuffer(length);
    const view = new DataView(bufferArr);
    const channels = [];
    let i, sample;
    let offset = 0;
    let pos = 0;

    // Write WAV header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit
    
    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    // Write interleaved data
    for (i = 0; i < buffer.numberOfChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
            view.setInt16(pos, sample, true); // write 16-bit sample
            pos += 2;
        }
        offset++;
    }
    
    // Helper functions for writing header
    function setUint16(data: number) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data: number) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
    
    // Convert buffer to base64
    const wavBytes = new Uint8Array(bufferArr);
    let binary = '';
    for (let i = 0; i < wavBytes.byteLength; i++) {
        binary += String.fromCharCode(wavBytes[i]);
    }
    return window.btoa(binary);
};


// --- Gemini API Services ---

export const transcribeVideo = async (videoFile: File): Promise<SubtitleEntry[]> => {
    const MAX_DURATION_SECONDS = 300; // 5 minutes

    const duration = await getVideoDuration(videoFile);
    if (duration > MAX_DURATION_SECONDS) {
        throw new Error(`Video is too long. Please upload a video shorter than ${MAX_DURATION_SECONDS / 60} minutes.`);
    }

    const audioContext = new AudioContext();
    const fileBuffer = await videoFile.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(fileBuffer);
    
    // For simplicity, we'll downmix to mono if it's stereo
    if (audioBuffer.numberOfChannels > 1) {
        const monoBuffer = audioContext.createBuffer(1, audioBuffer.length, audioBuffer.sampleRate);
        const monoChannel = monoBuffer.getChannelData(0);
        const leftChannel = audioBuffer.getChannelData(0);
        // Average channels for mono
        if (audioBuffer.numberOfChannels > 1) {
          const rightChannel = audioBuffer.getChannelData(1);
           for (let i = 0; i < audioBuffer.length; i++) {
                monoChannel[i] = (leftChannel[i] + rightChannel[i]) / 2;
           }
        } else {
           monoChannel.set(leftChannel);
        }
       
       const wavBase64 = audioBufferToWavBase64(monoBuffer);
    }

    const wavBase64 = audioBufferToWavBase64(audioBuffer);

    const audioPart = {
        inlineData: {
            mimeType: 'audio/wav',
            data: wavBase64,
        },
    };

    const prompt = `You are an expert audio transcription service.
Transcribe the provided audio file accurately.
Your response MUST be a valid JSON array of objects.
Each object must contain three keys: "startTime", "endTime", and "text".
- "startTime": The start time of the subtitle segment in seconds (number).
- "endTime": The end time of the subtitle segment in seconds (number).
- "text": The transcribed text for that segment (string).

Example format:
[
  { "startTime": 0.5, "endTime": 2.8, "text": "This is the first line of speech." },
  { "startTime": 3.2, "endTime": 5.1, "text": "And this is the second." }
]

Provide a complete and accurate transcription with precise timestamps.`;

    const textPart = { text: prompt };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [audioPart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            startTime: { type: Type.NUMBER, description: "Start time in seconds" },
                            endTime: { type: Type.NUMBER, description: "End time in seconds" },
                            text: { type: Type.STRING, description: "Transcription text" }
                        },
                        required: ["startTime", "endTime", "text"]
                    }
                }
            }
        });

        const subtitles = JSON.parse(response.text);
        // Basic validation
        if (Array.isArray(subtitles)) {
            return subtitles.filter(s => typeof s.startTime === 'number' && typeof s.endTime === 'number' && typeof s.text === 'string');
        }
        return [];

    } catch (error) {
        console.error("Error transcribing video:", error);
        throw new Error("Failed to generate subtitles from the video. The AI model could not process the audio.");
    }
};

export const translateSubtitles = async (
  subtitles: SubtitleEntry[],
  targetLanguage: string
): Promise<SubtitleEntry[]> => {
  if (subtitles.length === 0) {
    return [];
  }

  const originalTexts = subtitles.map(s => s.text);
  
  const prompt = `You are an expert translator for video subtitles. Translate the following subtitles into ${targetLanguage}.
The subtitles are provided as a JSON array of strings.
Your response must be a JSON array of strings with the exact same number of elements as the input array. Each string should be the translation of the corresponding original subtitle.

Original Subtitles (English):
${JSON.stringify(originalTexts)}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            description: "The translated subtitle text."
          },
        },
      },
    });
    
    const translatedTexts = JSON.parse(response.text);

    if (!Array.isArray(translatedTexts) || translatedTexts.length !== originalTexts.length) {
       console.error('Translation response is not a valid array or has a mismatched length.', {
          expected: originalTexts.length,
          got: translatedTexts.length
      });
      throw new Error(`Translation failed: Expected ${originalTexts.length} translated lines but received a different structure.`);
    }

    return subtitles.map((subtitle, index) => ({
      ...subtitle,
      text: translatedTexts[index] || subtitle.text, // Fallback to original if translation is empty
    }));

  } catch (error) {
    console.error("Error translating subtitles:", error);
    if (error instanceof Error && error.message.includes('JSON')) {
        throw new Error("Failed to parse translation from Gemini API. The response was not valid JSON.");
    }
    throw new Error("Failed to get translation from Gemini API. Please check your API key and network connection.");
  }
};