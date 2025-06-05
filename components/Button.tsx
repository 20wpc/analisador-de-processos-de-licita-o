
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}

export const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', ...props }) => {
  const baseStyles = "px-6 py-2.5 font-medium text-sm rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-150 ease-in-out flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed";
  
  let variantStyles = '';
  // Note: The className prop can override these variant styles if specific background/text colors are passed.
  // For the Download PDF button, custom classes are applied directly in AnalysisSection.tsx for emerald color.
  switch (variant) {
    case 'secondary':
      // Example: if AnalysisSection used variant="secondary" without overriding className
      variantStyles = 'bg-slate-600 hover:bg-slate-500 text-white focus:ring-slate-400';
      break;
    case 'danger':
      variantStyles = 'bg-red-600 hover:bg-red-500 text-white focus:ring-red-400';
      break;
    case 'primary':
    default:
      variantStyles = 'bg-sky-600 hover:bg-sky-500 text-white focus:ring-sky-400';
      break;
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};