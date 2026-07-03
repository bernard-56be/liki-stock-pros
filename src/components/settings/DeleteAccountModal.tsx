'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { deleteAccount } from '@/lib/actions/delete-account';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';

export function DeleteAccountModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationText, setConfirmationText] = useState('');

  const handleDelete = async () => {
    if (confirmationText !== 'SUPPRIMER') {
      setError('Veuillez taper "SUPPRIMER" pour confirmer.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await deleteAccount();

      if (!result.success) {
        setError(result.message || 'Erreur lors de la suppression');
        setIsLoading(false);
        return;
      }

      // Nettoyer la session locale
      const supabase = createClient();
      await supabase.auth.signOut();

      // Forcer la redirection et vider le cache
      router.push('/auth/login');
      router.refresh();
    } catch (err) {
      setError('Une erreur inattendue est survenue.');
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="danger" className="w-full sm:w-auto">
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer mon compte
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Suppression définitive du compte
              </div>
            </DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Toutes vos données personnelles, produits,
              et informations de boutique seront définitivement supprimées.
            </DialogDescription>
          </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <p className="font-semibold">⚠️ Conséquences :</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>Perte définitive de votre compte et de l'accès à la boutique</li>
              <li>Suppression de toutes les photos de produits (Storage)</li>
              <li>Suppression de toutes les données associées (ventes, historique)</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tapez <span className="font-bold">SUPPRIMER</span> pour confirmer
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => {
                setConfirmationText(e.target.value);
                setError(null);
              }}
              placeholder="Tapez SUPPRIMER ici"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={isLoading || confirmationText !== 'SUPPRIMER'}
            className="min-w-30"
          >
            {isLoading ? 'Suppression...' : 'Confirmer la suppression'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}