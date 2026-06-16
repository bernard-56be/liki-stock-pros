'use client';

import { ReactNode, useState } from 'react';
import { convertAmount, formatCurrency } from '@/lib/utils/currency';
import { processSale } from '@/lib/actions/process-sale';

// --- COMPOSANTS DE STRUCTURE UI (PROPRES) ---
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

export const CardHeader = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`border-b border-gray-200 pb-3 mb-4 ${className}`}>{children}</div>
);

export const CardTitle = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <h3 className={`text-xl font-bold text-gray-800 ${className}`}>{children}</h3>
);

export const CardContent = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={className}>{children}</div>
);


// --- COMPOSANT PANIER MULTI-DEVISES (CORRIGÉ) ---

interface CartItem {
  id: string;
  name: string;
  price: number;           // Prix fixé à la création du produit (ex: 10 ou 28500)
  currency: 'USD' | 'CDF'; // Devise d'origine du produit
  quantity: number;
}

interface CartProps {
  items: CartItem[];
  exchangeRate: number;    // Taux actif récupéré depuis Supabase (ou fallback 2850.02)
  onSuccess?: () => void;  // Callback pour vider le panier après succès
}

export function Cart({ items, exchangeRate, onSuccess }: CartProps) {
  // Par défaut, on initialise l'encaissement au comptoir en CDF
  const [saleCurrency, setSaleCurrency] = useState<'USD' | 'CDF'>('CDF');
  const [loading, setLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Blindage du taux de change
  const safeExchangeRate = exchangeRate && exchangeRate > 0 ? exchangeRate : 2850.02;

  // 1. Calcul du total global dans la devise d'encaissement choisie
  const totalGlobal = items.reduce((sum, item) => {
    const convertedPrice = convertAmount(item.price, safeExchangeRate, item.currency, saleCurrency);
    return sum + (convertedPrice * item.quantity);
  }, 0);

  // 2. Calcul de la contre-valeur pour l'affichage informatif
  const alternativeCurrency = saleCurrency === 'USD' ? 'CDF' : 'USD';
  const totalContreValeur = items.reduce((sum, item) => {
    const convertedPrice = convertAmount(item.price, safeExchangeRate, item.currency, alternativeCurrency);
    return sum + (convertedPrice * item.quantity);
  }, 0);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    
    setLoading(true);
    setFeedbackMessage(null);
    
    try {
      // On boucle individuellement sur chaque produit du panier
      for (const item of items) {
        // Prix unitaire converti selon la devise choisie au comptoir
        const rawUnitPrice = convertAmount(item.price, safeExchangeRate, item.currency, saleCurrency);
        
        // Arrondi mathématique pour éviter les flottants bizarres rejetés par le RPC de Supabase
        const cleanUnitPrice = Math.round(rawUnitPrice);
        const cleanQuantity = Math.floor(item.quantity);

        // MODIFICATION ICI : On passe 'saleCurrency' en 4ème paramètre à ton action serveur 
        // pour que ton backend sache si ce montant représente des USD ou des CDF.
        const result = await processSale(
          item.id,
          cleanQuantity,
          cleanUnitPrice,
          saleCurrency 
        );

        if (!result || !result.success) {
          throw new Error(result?.message || `Échec du traitement pour l'article ${item.name}`);
        }
      }

      setFeedbackMessage('Vente enregistrée avec succès !');
      if (onSuccess) onSuccess();

    } catch (err: any) {
      setFeedbackMessage(err.message || 'Erreur système lors de la validation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card padding="md" className="flex flex-col h-auto max-h-150 w-full max-w-md border border-gray-100">
      <CardHeader>
        <CardTitle className="text-lg flex justify-between items-center">
          <span>Panier d'Achat</span>
          <span className="text-xs font-normal text-gray-400">Taux : {safeExchangeRate}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between overflow-hidden">
        {/* Liste défilante des articles */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4 max-h-62.5">
          {items.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">Le panier est vide.</p>
          ) : (
            items.map((item) => {
              const itemPriceInSaleCurrency = convertAmount(item.price, safeExchangeRate, item.currency, saleCurrency);
              return (
                <div key={item.id} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                  <div>
                    <p className="font-semibold text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-400">
                      {item.quantity} × {formatCurrency(itemPriceInSaleCurrency, saleCurrency)}
                    </p>
                  </div>
                  <p className="font-medium text-gray-700">
                    {formatCurrency(itemPriceInSaleCurrency * item.quantity, saleCurrency)}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* SÉLECTEUR DE DEVISE AU COMPTOIR */}
        <div className="pt-2 border-t border-gray-100">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Devise d'encaissement au comptoir
          </label>
          <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
            <button
              type="button"
              onClick={() => setSaleCurrency('CDF')}
              className={`py-2 text-sm font-bold rounded-lg transition-all ${
                saleCurrency === 'CDF'
                  ? 'bg-white text-purple-700 shadow-sm border border-gray-100'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Encaisser en CDF (FC)
            </button>
            <button
              type="button"
              onClick={() => setSaleCurrency('USD')}
              className={`py-2 text-sm font-bold rounded-lg transition-all ${
                saleCurrency === 'USD'
                  ? 'bg-white text-purple-700 shadow-sm border border-gray-100'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Encaisser en USD ($)
            </button>
          </div>
        </div>

        { feedbackMessage && (
          <p className={`text-xs mt-2 font-medium p-2.5 rounded-lg ${feedbackMessage.includes('succès') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {feedbackMessage}
          </p>
        )}

        {/* AFFICHAGE DU TOTAL DYNAMIQUE ET CONTRE-VALEUR */}
        <div className="mt-4 p-3.5 bg-purple-50/50 border border-purple-100 rounded-xl space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-purple-900/70 uppercase">Total Net à Payer</span>
            <span className="text-xl font-black text-purple-700">
              {formatCurrency(totalGlobal, saleCurrency)}
            </span>
          </div>
          {items.length > 0 && (
            <div className="flex justify-between items-center text-[11px] text-purple-900/50 italic pt-1 border-t border-purple-100/50">
              <span>Contre-valeur :</span>
              <span>{formatCurrency(totalContreValeur, alternativeCurrency)}</span>
            </div>
          )}
        </div>

        {/* Bouton d'action final */}
        <button
          onClick={handleCheckout}
          disabled={items.length === 0 || loading}
          className="w-full mt-4 bg-purple-700 hover:bg-purple-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-[0.98]"
        >
          {loading ? 'Validation en cours...' : 'Finaliser la vente'}
        </button>
      </CardContent>
    </Card>
  );
}