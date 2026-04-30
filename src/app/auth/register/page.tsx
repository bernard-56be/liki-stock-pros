'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const router = useRouter();
  
  // États pour les champs et l'interface
  const [formData, setFormData] = useState({ fullName: '', boutiqueName: '', email: '', password: '' });
  const [errors, setErrors] = useState({ fullName: '', boutiqueName: '', email: '', password: '' });
  const [globalMessage, setGlobalMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  
  // Nouvel état pour le compte à rebours de sécurité (cooldown)
  const [cooldown, setCooldown] = useState(0);

  // Effet pour gérer le minuteur s'il y a un cooldown
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Fonction pour traduire les erreurs Supabase en Français
  const translateError = (message: string) => {
    if (message.includes('Password should be at least 6 characters')) return 'Le mot de passe doit contenir au moins 6 caractères.';
    if (message.includes('Unable to validate email address: invalid format')) return 'Format d\'adresse email invalide.';
    if (message.includes('Database error saving new user')) return 'Erreur de base de données, veuillez réessayer.';
    return message; // Retourne le message original si on ne l'a pas traduit
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;

    setErrors({ fullName: '', boutiqueName: '', email: '', password: '' });
    setGlobalMessage({ type: '', text: '' });

    // Validation
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

    setIsLoading(true);
    
    // ÉTAPE 1 : Inscription Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (authError) {
      // Gestion des erreurs courantes avec des messages personnalisés
      if (authError.message.includes('User already registered')) {
        setGlobalMessage({ type: 'error', text: 'Ce compte existe déjà. Redirection...' });
        setTimeout(() => router.push('/auth/login'), 2500);
      } else {
        setGlobalMessage({ type: 'error', text: translateError(authError.message) });
      }
      setIsLoading(false);
      return;
    }

    // ÉTAPE 2 : Création dans la table profiles ET boutiques
    if (authData.user) {
      const userId = authData.user.id;

      // A. Insérer dans profiles (upsert permet d'écraser si le backend a déjà créé la ligne via un trigger)
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        full_name: formData.fullName,
        email: formData.email,
        role: 'owner',
        status: 'active' // Le patron est actif d'office
      });

      if (profileError) {
        setGlobalMessage({ type: 'error', text: "Erreur création profil: " + profileError.message });
        setIsLoading(false); return;
      }

      // B. Insérer dans boutiques
      const generatedCode = 'LIKI-' + Math.floor(10000 + Math.random() * 90000);
      const { data: boutiqueData, error: dbError } = await supabase.from('boutiques').insert({ 
          name: formData.boutiqueName, 
          owner_id: userId,
          boutique_code: generatedCode
      }).select('id').single(); // On récupère l'ID généré de la boutique

      if (dbError) {
        setGlobalMessage({ type: 'error', text: "Erreur lors de la création de la boutique." });
        setIsLoading(false); return;
      }

      // C. Mettre à jour le profil avec le boutique_id
      if (boutiqueData) {
        await supabase.from('profiles').update({ boutique_id: boutiqueData.id }).eq('id', userId);
      }

      // SUCCÈS
      setGlobalMessage({ type: 'success', text: "Boutique créée avec succès ! Redirection..." });
      setFormData({ fullName: '', boutiqueName: '', email: '', password: '' });
      setTimeout(() => router.push('/dashboard'), 1500);
    }
    setIsLoading(false);
  };

  return (
    <GlassCard>
      <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">Devenir Propriétaire</h1>
      <p className="text-sm text-gray-600 text-center mb-6">Commencez à gérer votre stock efficacement</p>
      
      {/* Messages globaux (Succès ou Échec) */}
      {globalMessage.text && (
        <div className={`p-3 mb-4 rounded-xl text-sm font-bold text-center transition-all ${globalMessage.type === 'error' ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
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
          {errors.fullName && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.fullName}</p>}
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
          {errors.boutiqueName && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.boutiqueName}</p>}
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
          {errors.email && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.email}</p>}
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
          {errors.password && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.password}</p>}
        </div>

        <button 
          disabled={isLoading || cooldown > 0}
          type="submit"
          className={`w-full flex justify-center items-center font-bold py-3 rounded-xl shadow-lg transition-all transform mt-2 
            ${cooldown > 0 ? 'bg-gray-400 text-gray-800 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'}
            ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : cooldown > 0 ? (
            `RÉESSAYEZ DANS ${cooldown}s`
          ) : (
            "CRÉER MA BOUTIQUE"
          )}
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