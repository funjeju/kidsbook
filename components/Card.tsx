
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title: string;
  icon?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className, title, icon }) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${className}`}>
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-charcoal flex items-center gap-2">
            {icon}
            {title}
        </h3>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};
