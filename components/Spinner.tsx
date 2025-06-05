
import React from 'react';

interface SpinnerProps {
  message?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ message = "Processando..." }) => {
  return (
    <div className="flex flex-col justify-center items-center my-6" role="status" aria-live="polite">
      <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-sky-500" aria-hidden="true"></div>
      <p className="ml-3 text-slate-300 mt-2">{message}</p>
    </div>
  );
};