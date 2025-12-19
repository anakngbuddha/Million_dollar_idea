import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, elevated = false, ...props }) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 ${elevated ? 'shadow-lg' : 'shadow-sm'} transition-shadow duration-200 hover:shadow-md ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
};
