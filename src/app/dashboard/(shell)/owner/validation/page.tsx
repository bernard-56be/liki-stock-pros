/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Interface stricte pour éviter le type 'any'
interface PendingEmployee {
  id: string;
  full_name: string;
  email: string;
  status: string;
  boutique_id: string | null;
}

export default function OwnerValidationPage() {
  const [pendingEmployees, setPendingEmployees] = useState<PendingEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const supabase = createClient();

  // 1. Déclaration de la fonction en premier pour corriger l'erreur d'accès avant déclaration
  const fetchPendingEmployees = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('status', 'pending'); 

    if (error) {
      console.error("Erreur lors de la récupération:", error.message);
    } else if (data) {
      setPendingEmployees(data as PendingEmployee[]);
    }
    setLoading(false);
  };

  // 2. Appel de la fonction dans le useEffect en toute sécurité
  useEffect(() => {
    fetchPendingEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3. Gestion de la validation de l'employé
  const handleAcceptEmployee = async (employeeId: string) => {
    setActionLoading(employeeId);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecté");

      const { data: ownerProfile, error: ownerError } = await supabase
        .from('profiles')
        .select('boutique_id')
        .eq('id', user.id)
        .single();

      if (ownerError || !ownerProfile?.boutique_id) {
        alert("Erreur: Vous n'avez pas de boutique assignée pour accueillir cet employé.");
        setActionLoading(null);
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          boutique_id: ownerProfile.boutique_id, 
          status: 'active' 
        })
        .eq('id', employeeId);

      if (updateError) throw updateError;

      setPendingEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
      
    } catch (error) {
      console.error("Erreur lors de la validation:", error);
      alert("Une erreur est survenue lors de la validation.");
    } finally {
      setActionLoading(null);
    }
  };

  // 4. Gestion du refus de l'employé
  const handleRejectEmployee = async (employeeId: string) => {
    setActionLoading(employeeId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'rejected' })
        .eq('id', employeeId);

      if (error) throw error;
      setPendingEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
    } catch (error) {
      console.error("Erreur lors du refus:", error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Chargement des demandes...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Validation des Employés</h1>
      
      {pendingEmployees.length === 0 ? (
        <Card className="bg-gray-50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-gray-500">
            <span className="text-4xl mb-3">✅</span>
            <p>Aucun employé en attente de validation.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {pendingEmployees.map((employee) => (
            <Card key={employee.id} className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{employee.full_name || 'Nouvel Utilisateur'}</CardTitle>
                <p className="text-sm text-gray-500">{employee.email}</p>
              </CardHeader>
              <CardContent className="flex gap-2 pt-4">
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => handleAcceptEmployee(employee.id)}
                  disabled={actionLoading === employee.id}
                >
                  {actionLoading === employee.id ? 'Validation...' : 'Accepter cet employé'}
                </Button>
                
                <Button 
                  variant="outline"
                  className="text-red-600 hover:bg-red-50 border-red-200"
                  onClick={() => handleRejectEmployee(employee.id)}
                  disabled={actionLoading === employee.id}
                >
                  Refuser
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}