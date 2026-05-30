'use client';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { UserProfile } from '@/types';

interface ProfileFormProps {
  initialProfile: UserProfile;
}

export default function ProfileForm({ initialProfile }: ProfileFormProps) {
  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
  const [fullName, setFullName] = useState<string>(initialProfile.full_name);
  const [phoneNumber, setPhoneNumber] = useState<string>(initialProfile.phone_number || '');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage(null);

    if (!fullName.trim()) {
      setMessage({ type: 'error', text: 'Le nom complet est obligatoire.' });
      setIsUpdating(false);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone_number: phoneNumber || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', initialProfile.id);

    if (error) {
      setMessage({ type: 'error', text: `Erreur : ${error.message}` });
    } else {
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
    }
    setIsUpdating(false);
  };

  return (
    <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg bg-white p-6 rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Mes Informations de Base</h2>
      
      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nom Complet</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full border rounded-lg p-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Ex: Bernard Makangara"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Numéro de téléphone (Transactions Mobiles / Mobile Money)
        </label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="w-full border rounded-lg p-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Ex: +2438XXXXXXXX"
        />
        <p className="text-xs text-gray-500 mt-1">Utilisé pour les configurations M-Pesa, Airtel Money ou Orange Money.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-500">Rôle actuel sur le système</label>
        <span className="inline-block mt-1 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full capitalize">
          {initialProfile.role}
        </span>
      </div>

      <button
        type="submit"
        disabled={isUpdating}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
      >
        {isUpdating ? 'Enregistrement...' : 'Sauvegarder les modifications'}
      </button>
    </form>
  );
}