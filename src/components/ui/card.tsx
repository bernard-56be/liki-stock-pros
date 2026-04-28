import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = ({ children, className = '', padding = 'md' }: CardProps) => {
  const paddings = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-8',
  };

  return (
    <div className={`rounded-xl bg-white shadow-md ${paddings[padding]} ${className}`}>
      {children}
    </div>
  );
};

// Sous-composants optionnels pour mieux structurer
export const CardHeader = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`border-b border-gray-200 pb-3 mb-4 ${className}`}>{children}</div>
);

export const CardTitle = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <h3 className={`text-xl font-bold text-gray-800 ${className}`}>{children}</h3>
);

export const CardContent = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={className}>{children}</div>
);