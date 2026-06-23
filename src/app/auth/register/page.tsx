'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react'; 
import { GlassCard } from '@/components/ui/GlassCard';
import { registerAction } from '../../../lib/actions/auth';

export default function RegisterPage() {
  const [activeTab, setActiveTab] = useState<'owner' | 'employee'>('owner');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 
  const [showTermsModal, setShowTermsModal] = useState(false); 
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null); 
  const [errorMessage, setErrorMessage] = useState('');

  // Intercepter la soumission pour afficher d'abord l'alerte bloquante
  const handleFormAction = (formData: FormData) => {
    if (isLoading) return;
    setPendingFormData(formData);
    setShowTermsModal(true); 
  };

  // Exécution réelle de l'inscription après acceptation des conditions
  const handleConfirmRegister = async () => {
    if (!pendingFormData || isLoading) return;
    
    setIsLoading(true);
    setErrorMessage('');
    setShowTermsModal(false);
    
    // Injection du rôle dans user_metadata pour stabiliser le middleware et éviter les blocages RLS
    pendingFormData.append('role', activeTab);
    pendingFormData.append('user_metadata', JSON.stringify({ role: activeTab }));
    
    try {
      const result = await registerAction(pendingFormData);

      if (result?.error) {
        setErrorMessage(result.error);
        setIsLoading(false);
      }
      setIsLoading(false);
    } catch (err) {
      console.error('Register error:', err);
      setErrorMessage('Erreur lors de l\'inscription.');
      setIsLoading(false);
    }
  };

  return (
    <>
      <GlassCard>
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">Créer un compte</h1>

        <div className="relative flex w-full bg-white/40 p-1 rounded-xl mb-6 shadow-inner border border-white/50">
          <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-transform duration-300 ease-in-out ${activeTab === 'employee' ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'}`}></div>
          <button type="button" onClick={() => setActiveTab('owner')} className={`relative z-10 w-1/2 py-2 text-sm font-bold transition-colors duration-300 ${activeTab === 'owner' ? 'text-purple-700' : 'text-gray-500'}`}>Propriétaire</button>
          <button type="button" onClick={() => setActiveTab('employee')} className={`relative z-10 w-1/2 py-2 text-sm font-bold transition-colors duration-300 ${activeTab === 'employee' ? 'text-purple-700' : 'text-gray-500'}`}>Employé</button>
        </div>

        {errorMessage && (
          <div className="p-3 mb-4 rounded-xl text-sm font-bold text-center bg-red-100 text-red-600 border border-red-200">
            {errorMessage}
          </div>
        )}

        <form action={handleFormAction} className="space-y-4">
          <div className="w-full">
            <label className="block text-xs font-bold text-gray-700 mb-1 ml-1 uppercase">Nom Complet</label>
            <input type="text" name="fullName" required placeholder="Ex: Jean Kabulo" className="w-full p-3 rounded-xl bg-white/60 border border-white/40 text-gray-800 outline-none focus:ring-2 focus:ring-purple-500 shadow-inner" />
          </div>

          {activeTab === 'owner' ? (
            <div className="w-full animate-in fade-in slide-in-from-right-4 duration-300">
              <label className="block text-xs font-bold text-gray-700 mb-1 ml-1 uppercase">Nom de la Boutique</label>
              <input type="text" name="boutiqueName" required placeholder="Ex: Dépôt Victoire" className="w-full p-3 rounded-xl bg-white/60 border border-white/40 text-gray-800 outline-none focus:ring-2 focus:ring-purple-500 shadow-inner" />
            </div>
          ) : (
            <div className="w-full animate-in fade-in slide-in-from-left-4 duration-300">
              <label className="block text-xs font-bold text-gray-700 mb-1 ml-1 uppercase">Code Boutique (Donné par le gérant)</label>
              <input type="text" name="boutiqueCode" required placeholder="LIKI-XXXXXX" className="w-full p-3 rounded-xl bg-white/60 border border-white/40 text-gray-800 outline-none focus:ring-2 focus:ring-purple-500 shadow-inner uppercase" />
            </div>
          )}

          <div className="w-full">
            <label className="block text-xs font-bold text-gray-700 mb-1 ml-1 uppercase">Email</label>
            <input type="email" name="email" required placeholder="votre@email.com" className="w-full p-3 rounded-xl bg-white/60 border border-white/40 text-gray-800 outline-none focus:ring-2 focus:ring-purple-500 shadow-inner" />
          </div>

          <div className="w-full">
            <label className="block text-xs font-bold text-gray-700 mb-1 ml-1 uppercase">Mot de passe</label>
            <div className="relative w-full">
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                required 
                minLength={6} 
                placeholder="••••••••" 
                className="w-full p-3 pr-12 rounded-xl bg-white/60 border border-white/40 text-gray-800 outline-none focus:ring-2 focus:ring-purple-500 shadow-inner" 
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-700 p-1 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button 
            disabled={isLoading} 
            type="submit" 
            className={`w-full flex justify-center items-center bg-purple-700 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-purple-800 transition-all transform mt-2 disabled:opacity-70 disabled:pointer-events-none ${!isLoading ? 'active:scale-95' : ''}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                INSCRIPTION EN COURS...
              </>
            ) : (
              "S'INSCRIRE"
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-gray-600">Déjà un compte ?</p>
          <Link href="/auth/login" className="font-bold text-purple-700 hover:underline">
            Se connecter
          </Link>
        </div>
      </GlassCard>

      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 bg-white/80 border border-white/60 rounded-2xl shadow-2xl backdrop-blur-md animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-gray-800 mb-3">Acceptation des conditions</h2>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              En appuyant sur continuer, vous acceptez explicitement nos{' '}
              <Link href="/terms" className="font-bold text-purple-700 hover:underline target='_blank'">
                Conditions d'Utilisation
              </Link>{' '}
              et notre{' '}
              <Link href="/privacy" className="font-bold text-purple-700 hover:underline target='_blank'">
                Politique de Confidentialité
              </Link>
              . Votre session sera configurée de manière sécurisée.
            </p>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => { setShowTermsModal(false); setPendingFormData(null); }}
                className="w-1/2 py-2.5 text-sm font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmRegister}
                className="w-1/2 py-2.5 text-sm font-bold text-white bg-purple-700 rounded-xl hover:bg-purple-800 shadow-md transition-colors"
              >
                Continuer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}