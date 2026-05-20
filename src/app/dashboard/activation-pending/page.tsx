'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function PendingPage() {
  const router = useRouter();
  
  // Initialisation du client Supabase
  const supabase = createClient(); 

  // Fonction complète de déconnexion et de redirection
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login'); 
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="max-w-md rounded-lg bg-white p-8 shadow-md border border-gray-100">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 text-2xl">
          ⏳
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Compte en attente
        </h1>
        
        <p className="text-gray-600 mb-6 text-sm">
          Votre inscription est réussie ! Un administrateur ou le propriétaire de la boutique doit valider votre accès avant que vous ne puissiez utiliser la caisse de Liki-Stock Pro.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => router.refresh()}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
          >
            Vérifier si j&apos;ai été validé
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full text-xs text-gray-500 hover:text-gray-700 underline transition"
          >
            Se connecter avec un autre compte
          </button>
        </div>
      </div>
    </div>
  );
}