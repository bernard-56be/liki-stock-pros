// components/ui/dialog.tsx
'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/utils';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const DialogContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
} | null>(null);

const useDialog = () => {
  const context = React.useContext(DialogContext);
  if (!context) throw new Error('useDialog must be used within Dialog');
  return context;
};

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogTrigger({
  children,
  asChild,
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) {
  const { onOpenChange } = useDialog();

  const handleClick = () => {
    onOpenChange(true);
  };

  if (asChild) {
    // Vérifier que children est un élément React valide
    if (React.isValidElement(children)) {
      return React.cloneElement(children, {
        onClick: handleClick,
      } as React.Attributes);
    }
    // Fallback: envelopper dans un span
    return <span onClick={handleClick}>{children}</span>;
  }

  return <div onClick={handleClick}>{children}</div>;
}

export function DialogContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { open, onOpenChange } = useDialog();

  if (!open) return null;

  const handleOverlayClick = () => onOpenChange(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleOverlayClick}
    >
      <div
        className={cn(
          'relative w-full max-w-md p-6 bg-white/80 border border-white/60 rounded-2xl shadow-2xl backdrop-blur-md animate-in zoom-in-95 duration-200',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 rounded-full p-1 text-gray-500 hover:bg-gray-100/80 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-4">{children}</div>;
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold text-gray-800">{children}</h2>;
}

export function DialogDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-600 mt-1">{children}</p>;
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 flex flex-col sm:flex-row gap-3">{children}</div>;
}