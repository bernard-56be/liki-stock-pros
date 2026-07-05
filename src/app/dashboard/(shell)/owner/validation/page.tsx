/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { approveEmployee, rejectEmployee } from '@/lib/actions/employee-actions';

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [limitAlert, setLimitAlert] = useState<string | null>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<{ current: number; max: number; plan: string } | null>(null);
  const supabase = createClient();

  // Récupérer les employés en attente
  const fetchPendingEmployees = async () => {
    setLoading(true);
    setError(null);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('status', 'pending');

    if (error) {
      console.error("Erreur lors de la récupération:", error.message);
      setError("Erreur de chargement des demandes");
    } else if (data) {
      setPendingEmployees(data as PendingEmployee[]);
    }
    setLoading(false);
  };

  // ✅ Récupérer les infos d'abonnement (corrigé avec boutiques)
  const fetchSubscriptionInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('boutique_id')
        .eq('id', user.id)
        .single();

      if (!profile?.boutique_id) return;

      // ✅ Utiliser boutiques au lieu de shops
      const { data: shop } = await supabase
        .from('boutiques')
        .select('subscription')
        .eq('id', profile.boutique_id)
        .single();

      const subscription = shop?.subscription || 'BRONZE';
      
      // Compter les employés actifs
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('boutique_id', profile.boutique_id)
        .eq('role', 'employee')
        .eq('status', 'active');

      const limits = { BRONZE: 1, SILVER: 3, GOLD: Infinity };
      const max = limits[subscription as keyof typeof limits] || 1;

      setSubscriptionInfo({
        current: count || 0,
        max,
        plan: subscription,
      });
    } catch (err) {
      console.error('Erreur fetchSubscriptionInfo:', err);
    }
  };

  useEffect(() => {
    fetchPendingEmployees();
    fetchSubscriptionInfo();
  }, []);

  // Gestion de la validation
  const handleAcceptEmployee = async (employeeId: string) => {
    setActionLoading(employeeId);
    setError(null);
    setSuccess(null);
    setLimitAlert(null);

    try {
      const result = await approveEmployee(employeeId);

      if (!result.success) {
        if (result.limitReached) {
          setLimitAlert(result.error || 'Limite d\'employés atteinte');
          await fetchSubscriptionInfo();
        } else {
          setError(result.error || 'Erreur lors de l\'approbation');
        }
      } else {
        setSuccess('Employé approuvé avec succès');
        setPendingEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
        await fetchSubscriptionInfo();
      }
    } catch (error) {
      console.error("Erreur lors de la validation:", error);
      setError("Une erreur est survenue lors de la validation");
    } finally {
      setActionLoading(null);
    }
  };

  // Gestion du refus
  const handleRejectEmployee = async (employeeId: string) => {
    setActionLoading(employeeId);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await rejectEmployee(employeeId);
      if (result.success) {
        setSuccess('Employé refusé et supprimé');
        setPendingEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
      } else {
        setError(result.error || 'Erreur lors du refus');
      }
    } catch (error) {
      console.error("Erreur lors du refus:", error);
      setError("Erreur lors du refus");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Chargement des demandes...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Validation des Employés</h1>
        {subscriptionInfo && (
          <div className="text-sm bg-gray-100 px-4 py-2 rounded-lg">
            <span className="font-medium">Plan {subscriptionInfo.plan}:</span>
            <span className="ml-2">
              {subscriptionInfo.current} / {subscriptionInfo.max === Infinity ? '∞' : subscriptionInfo.max} employés
            </span>
          </div>
        )}
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-300 rounded-lg p-4 mb-4">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {limitAlert && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4">
          <p className="text-yellow-800 font-bold">⚠️ Limite d'employés atteinte</p>
          <p className="text-yellow-700">{limitAlert}</p>
          <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
            Passer à l'offre Silver
          </button>
        </div>
      )}
      
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