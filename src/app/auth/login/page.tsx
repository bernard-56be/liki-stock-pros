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

    // 1. Validation
    let hasError = false;
    const newErrors = { email: '', password: '' };

    if (!formData.email) { newErrors.email = "L'email est requis"; hasError = true; }
    if (!formData.password) { newErrors.password = 'Le mot de passe est requis'; hasError = true; }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    // 2. Connexion via Supabase
    setIsLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    setIsLoading(false);

    // 3. Gestion du résultat et Redirection
    if (error) {
      setGlobalMessage({ type: 'error', text: "Identifiants incorrects." });
      setFormData({ email: '', password: '' }); // Vide les champs en cas d'échec
    } else {
      setGlobalMessage({ type: 'success', text: "Connexion réussie !" });
      setFormData({ email: '', password: '' });
      
      // Récupération du rôle depuis les métadonnées (défini lors de l'inscription)
      const userRole = data.user?.user_metadata?.role;

      setTimeout(() => {
        if (userRole === 'owner') {
          router.push('/dashboard'); // Le dashboard principal
        } else {
          router.push('/dashboard/pending'); // Page d'attente pour les employés
        }
      }, 1000);
    }
  };

  return (
    <GlassCard>
      <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">Bon retour !</h1>
      <p className="text-sm text-gray-600 text-center mb-6">Connectez-vous à votre boutique</p>
      
      {globalMessage.text && (
        <div className={`p-3 mb-4 rounded-xl text-sm font-bold text-center ${globalMessage.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
          {globalMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="w-full">
          <label className="block text-xs font-bold text-gray-700 mb-1 ml-1 uppercase">Email professionnel</label>
          <input 
            type="email" 
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            placeholder="ex: patron@liki.com" 
            className={`w-full p-3 rounded-xl bg-white/60 border ${errors.email ? 'border-red-500' : 'border-white/40'} text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-purple-500 shadow-inner`} 
          />
          {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email}</p>}
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
          {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password}</p>}
        </div>

        <button 
          disabled={isLoading}
          type="submit"
          className="w-full flex justify-center items-center bg-purple-700 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-purple-800 transition-all transform active:scale-95 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : "SE CONNECTER"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <p className="text-gray-600">Nouveau propriétaire ?</p>
        <Link href="/auth/register" className="font-bold text-purple-700 hover:underline">
          Créer ma boutique maintenant
        </Link>
      </div>
    </GlassCard>
  );
}