import React, { useState, useCallback, useRef } from 'react';
import { SubtitleEntry } from './types';
import { translateSubtitles, transcribeVideo } from './services/geminiService';
import { LANGUAGES } from './constants';
import Header from './components/Header';
import VideoUpload from './components/VideoUpload';
import SubtitleEditor from './components/SubtitleEditor';
import LanguageSelector from './components/LanguageSelector';
import DownloadButtons from './components/DownloadButtons';
import Loader from './components/Loader';

const App: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [subtitles, setSubtitles] = useState<SubtitleEntry[]>([]);
  const [originalSubtitles, setOriginalSubtitles] = useState<SubtitleEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<string>(LANGUAGES[3]); // Default to Spanish
  const [currentTime, setCurrentTime] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);


  const resetState = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoFile(null);
    setVideoUrl(null);
    setSubtitles([]);
    setOriginalSubtitles([]);
    setIsLoading(false);
    setLoadingMessage('');
    setError(null);
    setCurrentTime(0);
  };
  
  const handleVideoUpload = useCallback(async (file: File) => {
    resetState();
    setIsLoading(true);
    setLoadingMessage('Preparing video...');
    setError(null);

    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(url);

    try {
      setLoadingMessage('Extracting audio and transcribing...');
      const generatedSubtitles = await transcribeVideo(file);
      
      if (generatedSubtitles.length === 0) {
        setError("Could not generate subtitles. The video may not contain detectable speech.");
      } else {
        setSubtitles(generatedSubtitles);
        setOriginalSubtitles(generatedSubtitles);
      }
      
    } catch (err) {
       setError(err instanceof Error ? err.message : "An unknown error occurred during transcription.");
       // Clean up video player if transcription fails
       setVideoFile(null);
       setVideoUrl(null);
       URL.revokeObjectURL(url);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, []);

  const handleTranslate = useCallback(async () => {
    if (originalSubtitles.length === 0) {
      setError("No subtitles to translate.");
      return;
    }
    setIsLoading(true);
    setLoadingMessage(`Translating to ${targetLanguage}...`);
    setError(null);

    try {
      const translated = await translateSubtitles(originalSubtitles, targetLanguage);
      setSubtitles(translated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred during translation.");
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [originalSubtitles, targetLanguage]);
  
  const handleSubtitleChange = (index: number, newText: string) => {
    const updatedSubtitles = [...subtitles];
    updatedSubtitles[index].text = newText;
    setSubtitles(updatedSubtitles);
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-slate-800/50 rounded-2xl shadow-lg p-6 md:p-8">
          {!videoFile && !isLoading && <VideoUpload onUpload={handleVideoUpload} />}
          
          {isLoading && <Loader message={loadingMessage} />}

          {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-lg text-center my-4">{error}</div>}
          
          {videoFile && !isLoading && subtitles.length > 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-sky-400 mb-4">Video &amp; Subtitles</h2>
                {videoUrl && (
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    className="w-full rounded-lg mb-6 shadow-lg bg-black"
                    onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                    onLoadedMetadata={() => setCurrentTime(0)}
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <LanguageSelector
                  selectedLanguage={targetLanguage}
                  onLanguageChange={setTargetLanguage}
                />
                <button
                  onClick={handleTranslate}
                  className="w-full sm:w-auto bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
                >
                  Translate
                </button>
              </div>

              <SubtitleEditor
                subtitles={subtitles}
                onSubtitleChange={handleSubtitleChange}
                currentTime={currentTime}
                onSeek={handleSeek}
              />

              <DownloadButtons subtitles={subtitles} videoFileName={videoFile.name} />
              
              <div className="text-center pt-4">
                 <button
                  onClick={resetState}
                  className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
                >
                  Start Over
                </button>
              </div>
            </div>
          )}
        </div>
        <footer className="text-center mt-8 text-slate-500">
          <p>Powered by React, Tailwind CSS, and Gemini</p>
        </footer>
      </main>
    </div>
  );
};

export default App;