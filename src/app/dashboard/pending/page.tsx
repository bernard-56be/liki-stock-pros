'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client'; 
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PendingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // On instancie le client navigateur ici
  const supabase = createClient();

  useEffect(() => {
    const checkStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', user.id)
        .single();

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      if (profile.status === 'active') {
        router.push('/dashboard/employee/ventes');
        return;
      }

      setLoading(false);

      // Temps réel
      const subscription = supabase
        .channel(`profile_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          (payload: { new: { status: string } }) => {
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
        subscription.unsubscribe();
      };
    };

    checkStatus();
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
        <Card className="max-w-md text-center">
          <CardContent>
            <h2 className="mb-2 text-2xl font-bold text-red-600">Erreur</h2>
            <p className="text-gray-600">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/auth/login');
              }}
            >
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-blue-50 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <Card className="text-center">
          <CardContent className="pt-8 pb-6">
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }} className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100">
              <svg className="h-10 w-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.div>

            <h2 className="mb-2 text-2xl font-bold text-gray-800">Compte en attente de validation</h2>
            <p className="mb-4 text-gray-600">Votre inscription a été enregistrée. Le propriétaire de la boutique doit approuver votre compte.</p>

            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
              Vous pouvez fermer cette page et revenir plus tard. La mise à jour se fera automatiquement lorsque vous serez accepté.
            </div>

            <Button
              variant="outline"
              className="mt-6"
              onClick={async () => {
                await supabase.auth.signOut();
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