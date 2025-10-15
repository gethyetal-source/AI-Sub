
import React from 'react';

interface LoaderProps {
  message: string;
}

const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="w-16 h-16 border-4 border-t-sky-400 border-r-sky-400 border-b-slate-600 border-l-slate-600 rounded-full animate-spin"></div>
      <p className="text-slate-300 text-lg font-medium">{message}</p>
    </div>
  );
};

export default Loader;
