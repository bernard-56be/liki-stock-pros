import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'default' | 'sm' | 'lg'; 
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'default', // Valeur par défaut
  isLoading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) => {
  // Styles de base (on retire px et py car ils vont dans les tailles)
  const baseStyle =
    'rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  // Styles selon la variante
  const variants = {
    primary: 'bg-purple-700 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-purple-800 transition-all transform active:scale-95 mt-4 disabled:opacity-70',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400',
    outline:
      'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  // Styles selon la taille
  const sizes = {
    default: 'px-4 py-2 text-sm',
    sm: 'px-3 py-1.5 text-xs', // Idéal pour ton tableau d'inventaire
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <span>Chargement...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};