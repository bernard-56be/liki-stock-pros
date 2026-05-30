'use client';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState } from 'react';

export default function PendingPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
  const [loading, setLoading] = useState<boolean>(false);

  const checkStatus = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile && profile.role !== 'pending') {
        router.push('/dashboard');
        router.refresh();
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center">
      <div className="max-w-md bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Compte en attente ⏳</h1>
        <p className="text-gray-600 mb-6">
          Salut ! Ton compte a bien été créé. Pour des raisons de sécurité anti-fraude, le propriétaire de la boutique doit valider ton accès avant que tu puisses utiliser la caisse.
        </p>
        <button
          onClick={checkStatus}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Vérification...' : 'Vérifier si j\'ai été approuvé'}
        </button>
      </div>
    </div>
  );
}