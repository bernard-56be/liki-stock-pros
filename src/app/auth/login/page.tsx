'use client';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';

export default function LoginPage() {
  return (
    <GlassCard>
      <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">Bon retour !</h1>
      <p className="text-sm text-gray-600 text-center mb-8">Connectez-vous à votre boutique</p>
      
      <form className="space-y-4">
        {/* Champ Email */}
        <div className="w-full">
          <label className="block text-xs font-bold text-gray-700 mb-1 ml-1 uppercase">
            Email professionnel
          </label>
          <input 
            type="email" 
            placeholder="ex: patron@liki.com" 
            className="w-full p-3 rounded-xl bg-white/60 border border-white/40 text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-purple-500 shadow-inner" 
          />
        </div>
        
        {/* Champ Mot de passe */}
        <div className="w-full">
          <label className="block text-xs font-bold text-gray-700 mb-1 ml-1 uppercase">
            Mot de passe
          </label>
          <input 
            type="password" 
            placeholder="••••••••" 
            className="w-full p-3 rounded-xl bg-white/60 border border-white/40 text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-purple-500 shadow-inner" 
          />
        </div>
        
        {/* Champ Code Boutique - Optionnel pour l'employé */}
        <div className="w-full">
            <label className="block text-xs font-bold text-gray-700 mb-1 ml-1 uppercase">
                Code Boutique (pour employé)
            </label>
            <input 
            type="text" 
            placeholder="Ex: LIKI-1234" 
            className="w-full p-3 rounded-xl bg-white/60 border border-white/40 text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-purple-500 shadow-inner" 
        />
        </div>

        <button className="w-full bg-purple-700 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-purple-800 transition-all transform active:scale-95 mt-4">
          SE CONNECTER
        </button>
      </form>

      <div className="mt-8 text-center text-sm">
        <p className="text-gray-600">Vous êtes un nouveau propriétaire ?</p>
        <Link href="/auth/register" className="font-bold text-purple-700 hover:underline">
          Créer ma boutique maintenant
        </Link>
      </div>
    </GlassCard>
  );
}