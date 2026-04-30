'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [globalMessage, setGlobalMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({ email: '', password: '' });
    setGlobalMessage({ type: '', text: '' });

    // Validation simple
    let hasError = false;
    const newErrors = { email: '', password: '' };
    if (!formData.email) { newErrors.email = "L'email est requis"; hasError = true; }
    if (!formData.password) { newErrors.password = 'Le mot de passe est requis'; hasError = true; }
    if (hasError) { setErrors(newErrors); return; }

    setIsLoading(true);
    
    // 1. Connexion
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (authError) {
      setGlobalMessage({ type: 'error', text: "Identifiants incorrects ou compte inexistant." });
      setIsLoading(false);
      return;
    }

    // 2. Récupération du Profil pour la redirection intelligente
    if (authData.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', authData.user.id)
        .single();

      if (!profile) {
        setGlobalMessage({ type: 'error', text: "Profil introuvable." });
        setIsLoading(false);
        return;
      }

      setGlobalMessage({ type: 'success', text: "Connexion réussie ! Chargement..." });
      
      // 3. Le système d'Aiguillage (Routing)
      setTimeout(() => {
        if (profile.role === 'owner') {
          // Si c'est le patron, on l'envoie sur son dashboard principal
          router.push('/dashboard');
        } else if (profile.role === 'employee') {
          // Si c'est un employé, on vérifie son statut
          if (profile.status === 'pending') {
            router.push('/dashboard/pending'); // En attente de validation
          } else {
            router.push('/dashboard/vendeur'); // Interface de vente (à créer plus tard)
          }
        }
      }, 1000);
    }
  };

  return (
    <GlassCard>
      <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">Bon retour !</h1>
      <p className="text-sm text-gray-600 text-center mb-6">Connectez-vous à votre espace</p>
      
      {globalMessage.text && (
        <div className={`p-3 mb-4 rounded-xl text-sm font-bold text-center ${globalMessage.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
          {globalMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="w-full">
          <label className="block text-xs font-bold text-gray-700 mb-1 ml-1 uppercase">Email</label>
          <input 
            type="email" 
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            placeholder="votre@email.com" 
            className={`w-full p-3 rounded-xl bg-white/60 border ${errors.email ? 'border-red-500' : 'border-white/40'} text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-purple-500 shadow-inner`} 
          />
          {errors.email && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.email}</p>}
        </div>
        
        <div className="w-full">
          <label className="block text-xs font-bold text-gray-700 mb-1 ml-1 uppercase">Mot de passe</label>
          <input 
            type="password" 
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            placeholder="••••••••" 
            className={`w-full p-3 rounded-xl bg-white/60 border ${errors.password ? 'border-red-500' : 'border-white/40'} text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-purple-500 shadow-inner`} 
          />
          {errors.password && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.password}</p>}
        </div>

        <button 
          disabled={isLoading}
          type="submit"
          className="w-full flex justify-center items-center bg-purple-700 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-purple-800 transition-all transform active:scale-95 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
             <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : "SE CONNECTER"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <p className="text-gray-600">Nouveau propriétaire ?</p>
        <Link href="/auth/register" className="font-bold text-purple-700 hover:underline">
          Créer ma boutique
        </Link>
      </div>
    </GlassCard>
  );
}