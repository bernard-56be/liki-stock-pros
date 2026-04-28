'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { supabase } from '@/lib/supabase'; 

export default function RegisterPage() {
  const router = useRouter();
  
  // États pour les champs
  const [formData, setFormData] = useState({ fullName: '', boutiqueName: '', email: '', password: '' });
  
  // États pour les erreurs et l'interface
  const [errors, setErrors] = useState({ fullName: '', boutiqueName: '', email: '', password: '' });
  const [globalMessage, setGlobalMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({ fullName: '', boutiqueName: '', email: '', password: '' });
    setGlobalMessage({ type: '', text: '' });

    // 1. Validation obligatoire
    let hasError = false;
    const newErrors = { fullName: '', boutiqueName: '', email: '', password: '' };

    if (!formData.fullName) { newErrors.fullName = 'Le nom est obligatoire'; hasError = true; }
    if (!formData.boutiqueName) { newErrors.boutiqueName = 'Le nom de la boutique est obligatoire'; hasError = true; }
    if (!formData.email) { newErrors.email = "L'email est obligatoire"; hasError = true; }
    if (!formData.password) { newErrors.password = 'Le mot de passe est obligatoire'; hasError = true; }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    // 2. Envoi à Supabase
    setIsLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      setGlobalMessage({ type: 'error', text: "Erreur de connexion." });
    } else {
      // ICI : On utilise enfin 'data' !
      // On récupère le rôle stocké dans les métadonnées de l'utilisateur
      const userRole = data.user?.user_metadata?.role;

      if (userRole === 'owner') {
        router.push('/dashboard');
      } else {
        router.push('/dashboard/pending');
      }
    }

    setIsLoading(false);

    // 3. Gestion du résultat
    if (error) {
      setGlobalMessage({ type: 'error', text: "Échec de l'inscription : " + error.message });
      setFormData({ fullName: '', boutiqueName: '', email: '', password: '' }); // Vide les champs
    } else {
      setGlobalMessage({ type: 'success', text: "Succès ! Redirection en cours..." });
      setFormData({ fullName: '', boutiqueName: '', email: '', password: '' }); // Vide les champs
      
      // Redirection après un court délai pour voir le message de succès
      setTimeout(() => {
        router.push('/dashboard'); // Redirige vers le dashboard proprio
      }, 1500);
    }
  };

  return (
    <GlassCard>
      <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">Devenir Propriétaire</h1>
      <p className="text-sm text-gray-600 text-center mb-6">Commencez à gérer votre stock intelligemment</p>
      
      {/* Messages globaux (Succès ou Échec) */}
      {globalMessage.text && (
        <div className={`p-3 mb-4 rounded-xl text-sm font-bold text-center ${globalMessage.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
          {globalMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Champ Nom */}
        <div className="w-full">
          <label className="block text-xs font-bold text-gray-700 mb-1 ml-1 uppercase">Nom Complet</label>
          <input 
            type="text" 
            value={formData.fullName}
            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            placeholder="Ex: Jean Kabulo" 
            className={`w-full p-3 rounded-xl bg-white/60 border ${errors.fullName ? 'border-red-500' : 'border-white/40'} text-gray-800 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-purple-500 shadow-inner`}
          />
          {errors.fullName && <p className="text-red-500 text-xs mt-1 ml-1">{errors.fullName}</p>}
        </div>

        {/* Champ Boutique */}
        <div className="w-full">
          <label className="block text-xs font-bold text-gray-700 mb-1 ml-1 uppercase">Ma Boutique</label>
          <input 
            type="text" 
            value={formData.boutiqueName}
            onChange={(e) => setFormData({...formData, boutiqueName: e.target.value})}
            placeholder="Ex: Dépôt Victoire" 
            className={`w-full p-3 rounded-xl bg-white/60 border ${errors.boutiqueName ? 'border-red-500' : 'border-white/40'} text-gray-800 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-purple-500 shadow-inner`}
          />
          {errors.boutiqueName && <p className="text-red-500 text-xs mt-1 ml-1">{errors.boutiqueName}</p>}
        </div>

        {/* Champ Email */}
        <div className="w-full">
          <label className="block text-xs font-bold text-gray-700 mb-1 ml-1 uppercase">Email</label>
          <input 
            type="email" 
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            placeholder="patron@boutique.com" 
            className={`w-full p-3 rounded-xl bg-white/60 border ${errors.email ? 'border-red-500' : 'border-white/40'} text-gray-800 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-purple-500 shadow-inner`}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email}</p>}
        </div>

        {/* Champ Password */}
        <div className="w-full">
          <label className="block text-xs font-bold text-gray-700 mb-1 ml-1 uppercase">Mot de passe</label>
          <input 
            type="password" 
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            placeholder="••••••••" 
            className={`w-full p-3 rounded-xl bg-white/60 border ${errors.password ? 'border-red-500' : 'border-white/40'} text-gray-800 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-purple-500 shadow-inner`}
          />
          {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password}</p>}
        </div>

        <button 
          disabled={isLoading}
          type="submit"
          className="w-full flex justify-center items-center bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-green-700 transition-all transform active:scale-95 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : "CRÉER MA BOUTIQUE"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <p className="text-gray-600">Déjà inscrit ?</p>
        <Link href="/auth/login" className="font-bold text-purple-700 hover:underline">
          Retour à la connexion
        </Link>
      </div>
    </GlassCard>
  );
}