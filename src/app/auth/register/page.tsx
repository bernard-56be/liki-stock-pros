'use client';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';

export default function RegisterPage() {
  return (
    <GlassCard>
      <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">Devenir Propriétaire</h1>
      <p className="text-sm text-gray-600 text-center mb-8">Commencez à gérer votre stock intelligemment</p>
      
      <form className="space-y-4">
        {/* Champ Nom */}
        <div className="w-full">
          <label className="block text-xs font-bold text-gray-700 mb-1 ml-1 uppercase">Nom Complet</label>
          <input 
            type="text" 
            placeholder="Ex: Jean Kabulo" 
            className="w-full p-3 rounded-xl bg-white/60 border border-white/40 text-gray-800 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-purple-500 shadow-inner"
          />
        </div>

        {/* Champ Boutique */}
        <div className="w-full">
          <label className="block text-xs font-bold text-gray-700 mb-1 ml-1 uppercase">Ma Boutique</label>
          <input 
            type="text" 
            placeholder="Ex: Dépôt Victoire" 
            className="w-full p-3 rounded-xl bg-white/60 border border-white/40 text-gray-800 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-purple-500 shadow-inner"
          />
        </div>

        {/* Champ Email */}
        <div className="w-full">
          <label className="block text-xs font-bold text-gray-700 mb-1 ml-1 uppercase">Email</label>
          <input 
            type="email" 
            placeholder="patron@boutique.com" 
            className="w-full p-3 rounded-xl bg-white/60 border border-white/40 text-gray-800 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-purple-500 shadow-inner"
          />
        </div>

        {/* Champ Password */}
        <div className="w-full">
          <label className="block text-xs font-bold text-gray-700 mb-1 ml-1 uppercase">Mot de passe</label>
          <input 
            type="password" 
            placeholder="••••••••" 
            className="w-full p-3 rounded-xl bg-white/60 border border-white/40 text-gray-800 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-purple-500 shadow-inner"
          />
        </div>
        
        <p className="text-[10px] text-gray-500 px-2 italic">
          En vous inscrivant, vous devenez l&apos;administrateur principal de cette boutique.
        </p>

        <button className="w-full bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-green-700 transition-all transform active:scale-95 mt-2">
          CRÉER MA BOUTIQUE
        </button>
      </form>

      <div className="mt-8 text-center text-sm">
        <p className="text-gray-600">Déjà inscrit ?</p>
        <Link href="/auth/login" className="font-bold text-purple-700 hover:underline">
          Retour à la connexion
        </Link>
      </div>
    </GlassCard>
  );
}