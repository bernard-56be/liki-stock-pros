'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client'; 
import { Card, CardContent } from '@/components/ui/card'; 
import { Button } from '@/components/ui/button';
import { getInitialProfileStatus, signOutAction } from '@/lib/actions/pending';

// Typage strict pour le Realtime
type ProfilePayload = {
  new: {
    status: string;
  };
};

export default function PendingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  const supabase = createClient();

  // Effect 1 : Charger le statut initial côté serveur
  useEffect(() => {
    let isMounted = true;

    const initPage = async () => {
      const { user, status, error: serverError } = await getInitialProfileStatus();

      if (!isMounted) return;

      if (serverError) {
        setError(serverError);
        setLoading(false);
        return;
      }

      if (!user) {
        router.push('/auth/login');
        return;
      }

      if (status === 'active') {
        router.push('/dashboard/employee/ventes');
        return;
      } else if (status === 'rejected') {
        setError("Votre compte a été refusé par le propriétaire.");
        setLoading(false);
        return;
      }

      // Stocker l'ID de l'utilisateur pour activer l'écoute temps réel
      setUserId(user.id);
      setLoading(false);
    };

    initPage();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Effect 2 : Mettre en place le Realtime uniquement quand l'ID utilisateur est disponible
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`realtime_profile_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
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
  }, [userId, router, supabase]);

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
              await signOutAction();
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
              variant="outline"
              className="text-gray-500 hover:text-red-600 w-full"
              onClick={async () => {
                await signOutAction();
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