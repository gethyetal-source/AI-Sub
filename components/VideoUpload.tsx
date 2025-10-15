
import React, { useState, useCallback } from 'react';

interface VideoUploadProps {
  onUpload: (file: File) => void;
}

const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const VideoUpload: React.FC<VideoUploadProps> = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };
  
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  }, [onUpload]);

  const dragDropClasses = isDragging ? 'border-sky-400 bg-slate-700/50' : 'border-slate-600';

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-sky-400 mb-4">Upload Your Video</h2>
      <p className="text-slate-400 mb-6">Start by selecting a video file from your device.</p>
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed ${dragDropClasses} rounded-xl p-8 md:p-12 cursor-pointer transition-all duration-300`}
      >
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          id="video-upload"
        />
        <label htmlFor="video-upload" className="flex flex-col items-center justify-center space-y-4 cursor-pointer">
          <UploadIcon className="h-12 w-12 text-slate-500" />
          <p className="text-slate-300 font-semibold">
            <span className="text-sky-400">Click to upload</span> or drag and drop
          </p>
          <p className="text-slate-500 text-sm">MP4, MOV, AVI, etc.</p>
        </label>
      </div>
    </div>
  );
};

export default VideoUpload;
