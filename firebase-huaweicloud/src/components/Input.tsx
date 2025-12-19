import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  helper?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  helper,
  className,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-slate-700 font-semibold text-sm mb-2.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none">{icon}</div>}
        <input
          className={`w-full h-12 ${icon ? 'pl-11' : 'px-4'} pr-4 border rounded-lg text-sm font-medium transition-all duration-200 bg-slate-50
            ${error ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-200 focus:bg-white' : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:bg-white'}
            focus:outline-none
            disabled:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-500 disabled:border-slate-200
            placeholder:text-slate-400
            ${className || ''}`}
          {...props}
        />
      </div>
      {error && <p className="text-red-600 text-xs mt-1.5 font-medium flex items-center gap-1"><span>✕</span> {error}</p>}
      {helper && !error && <p className="text-slate-500 text-xs mt-1.5">{helper}</p>}
    </div>
  );
};
