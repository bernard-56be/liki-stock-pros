'use client';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client'; 
import { Card, CardContent } from '@/components/ui/card'; 
import { Button } from '@/components/ui/button';
// Importation des Server Actions
import { getInitialProfileStatus, signOutAction } from '@/lib/actions/pending';

// Typage strict pour le Realtime (Exigence de la semaine 3)
type ProfilePayload = {
  new: {
    status: string;
  };
};

export default function PendingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    const initPage = async () => {
      // 1. Appel du Server Action pour le statut initial
      const { user, status, error: serverError } = await getInitialProfileStatus();

      if (serverError) {
        setError(serverError);
        setLoading(false);
        return;
      }

      // Si pas d'utilisateur, redirection login
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Redirection immédiate si déjà actif
      if (status === 'active') {
        router.push('/dashboard/employee/ventes');
        return;
      } else if (status === 'rejected') {
        setError("Votre compte a été refusé par le propriétaire.");
        setLoading(false);
        return;
      }

      // L'utilisateur est bien 'pending', on arrête le loader initial
      setLoading(false);

      // 2. Mise en place de l'écoute Temps Réel (Client-side)
      const channel = supabase
        .channel(`profile_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          (payload: ProfilePayload) => {
            const newStatus = payload.new.status;
            if (newStatus === 'active') {
              router.push('/dashboard/employee/ventes');
            } else if (newStatus === 'rejected') {
              setError("Votre compte a été refusé par le propriétaire.");
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    initPage();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 p-4">
        <Card className="max-w-md text-center p-6">
          <h2 className="mb-2 text-2xl font-bold text-red-600">Oups !</h2>
          <p className="text-gray-600">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4 w-full" 
            onClick={async () => { 
              await signOutAction(); // Utilisation du Server Action
              router.push('/auth/login'); 
            }}
          >
            Retour à la connexion
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-blue-50 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <Card className="text-center shadow-lg">
          <CardContent className="pt-8 pb-6">
            <motion.div 
                animate={{ scale: [1, 1.05, 1] }} 
                transition={{ repeat: Infinity, duration: 2 }} 
                className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100"
            >
              <span className="text-4xl">⏳</span>
            </motion.div>

            <h2 className="mb-2 text-2xl font-bold text-gray-800">Compte en attente</h2>
            <p className="mb-4 text-gray-600">
              Votre inscription est bien enregistrée. Le propriétaire doit valider votre accès.
            </p>

            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700 border border-blue-100 mb-6">
              Cette page se rafraîchira automatiquement dès que vous serez validé.
            </div>

            <Button
              variant="outline" // Correction appliquée (exit variant="ghost")
              className="text-gray-500 hover:text-red-600 w-full"
              onClick={async () => {
                await signOutAction(); // Utilisation du Server Action
                router.push('/auth/login');
              }}
            >
              Se déconnecter
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}