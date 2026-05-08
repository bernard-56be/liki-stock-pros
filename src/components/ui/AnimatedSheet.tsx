'use client';

import { memo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Position du panneau : 'right' (défaut) ou 'left' */
  side?: 'right' | 'left';
  /** Largeur max (ex: 'max-w-md') */
  className?: string;
}

/**
 * Wrapper animé optimisé pour mobile (2 Go RAM) :
 * - n'anime que l'opacité (overlay) et translateX (panneau)
 * - utilise AnimatePresence pour démonter le DOM après la sortie
 * - transition spring légère (300ms max, 60 FPS)
 */
export const AnimatedSheet = memo(function AnimatedSheet({
  isOpen,
  onClose,
  children,
  side = 'right',
  className = 'max-w-md',
}: AnimatedSheetProps) {
  const translateInitial = side === 'right' ? '100%' : '-100%';
  const translateFinal = '0%';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay (fond noir) – animation uniquement sur opacity */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={onClose}
          />

          {/* Panneau latéral – animation uniquement sur translateX */}
          <motion.div
            initial={{ x: translateInitial }}
            animate={{ x: translateFinal }}
            exit={{ x: translateInitial }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
              mass: 0.8,
            }}
            className={`fixed top-0 ${side === 'right' ? 'right-0' : 'left-0'} z-50 h-full w-full ${className} overflow-y-auto bg-white shadow-xl`}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});