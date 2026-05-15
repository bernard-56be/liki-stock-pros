'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { registerAction } from '../../../lib/actions/auth';

export default function RegisterPage() {
  const [activeTab, setActiveTab] = useState<'owner' | 'employee'>('owner');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setErrorMessage('');
    
    formData.append('role', activeTab);
    
    try {
      const result = await registerAction(formData);

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

      <form action={handleSubmit} className="space-y-4">
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
          <input type="password" name="password" required minLength={6} placeholder="••••••••" className="w-full p-3 rounded-xl bg-white/60 border border-white/40 text-gray-800 outline-none focus:ring-2 focus:ring-purple-500 shadow-inner" />
        </div>

        <button disabled={isLoading} type="submit" className="w-full flex justify-center items-center bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-green-700 transition-all transform active:scale-95 mt-2 disabled:opacity-70">
          {isLoading ? "CHARGEMENT..." : "S'INSCRIRE"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <p className="text-gray-600">Déjà un compte ?</p>
        <Link href="/auth/login" className="font-bold text-purple-700 hover:underline">
          Se connecter
        </Link>
      </div>
    </GlassCard>
  );
}