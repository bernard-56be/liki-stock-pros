'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { loginAction } from '../actions';

function LoginPageContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'owner' | 'employee'>('owner');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const nextPath = searchParams.get('next') ?? '';

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setErrorMessage('');
    
    const result = await loginAction(formData);
    
    if (result?.error) {
      setErrorMessage(result.error);
      setIsLoading(false);
    }
  };

  return (
    <GlassCard>
      <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">Bon retour !</h1>
      
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
        <input type="hidden" name="next" value={nextPath} />
        <div className="w-full">
          <label className="block text-xs font-bold text-gray-700 mb-1 ml-1 uppercase">Email</label>
          <input type="email" name="email" required placeholder={activeTab === 'owner' ? "patron@boutique.com" : "employe@boutique.com"} className="w-full p-3 rounded-xl bg-white/60 border border-white/40 text-gray-900 outline-none focus:ring-2 focus:ring-purple-500 shadow-inner" />
        </div>
        
        <div className="w-full">
          <label className="block text-xs font-bold text-gray-700 mb-1 ml-1 uppercase">Mot de passe</label>
          <input type="password" name="password" required placeholder="••••••••" className="w-full p-3 rounded-xl bg-white/60 border border-white/40 text-gray-900 outline-none focus:ring-2 focus:ring-purple-500 shadow-inner" />
        </div>

        <button disabled={isLoading} type="submit" className="w-full flex justify-center items-center bg-purple-700 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-purple-800 transition-all transform active:scale-95 mt-4 disabled:opacity-70">
          {isLoading ? "CONNEXION EN COURS..." : "SE CONNECTER"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <p className="text-gray-600">{activeTab === 'owner' ? "Nouveau propriétaire ?" : "Nouvel employé ?"}</p>
        <Link href="/auth/register" className="font-bold text-purple-700 hover:underline">
          Créer un compte
        </Link>
      </div>
    </GlassCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}