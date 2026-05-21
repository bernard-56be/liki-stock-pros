'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// 1. On respecte la règle du sprint : on type nos données proprement (pas de 'any')
interface PendingEmployee {
  id: string;
  nom: string;
  email: string;
  boutique_id: string | null;
}

export default function OwnerValidationPage() {
  const [pendingEmployees, setPendingEmployees] = useState<PendingEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // On simule l'ID de la boutique du patron connecté (à récupérer depuis son profil plus tard)
  const currentOwnerBoutiqueId = "ID_DE_LA_BOUTIQUE_ICI"; 

  // 2. Fonction pour récupérer les employés en attente (sans boutique)
  const fetchPendingEmployees = async () => {
    setLoading(true);
    // Adapte 'employes' au nom réel de ta table dans Supabase
    const { data, error } = await supabase
      .from('employes') 
      .select('*')
      .is('boutique_id', null); // On cherche ceux qui n'ont pas encore de boutique

    if (error) {
      console.error("Erreur lors de la récupération:", error);
    } else if (data) {
      setPendingEmployees(data as PendingEmployee[]);
    }
    setLoading(false);
  };

 useEffect(() => {
  // On définit la fonction ici, à l'intérieur du hook
  const fetchPendingEmployees = async () => {
    setLoading(true);
    
    // Remplace 'employes' par le nom exact de ta table dans Supabase
    const { data, error } = await supabase
      .from('employes')
      .select('*')
      .is('boutique_id', null);

    if (error) {
      console.error("Erreur lors de la récupération:", error);
    } else if (data) {
      // On caste les données proprement pour respecter le typage
      setPendingEmployees(data as PendingEmployee[]);
    }
    setLoading(false);
  };

  // On appelle la fonction immédiatement
  fetchPendingEmployees();
}, [supabase]); // On inclut 'supabase' comme dépendance unique

  // 3. LA MISSION PRINCIPALE : La fonction du bouton "Accepter"
  const handleAcceptEmployee = async (employeeId: string) => {
    const { error } = await supabase
      .from('employes')
      .update({ boutique_id: currentOwnerBoutiqueId }) // On assigne la boutique !
      .eq('id', employeeId);

    if (error) {
      alert("Erreur lors de l'acceptation de l'employé.");
      console.error(error);
    } else {
      alert("Employé accepté avec succès !");
      // On met à jour la liste affichée à l'écran
      fetchPendingEmployees(); 
      router.refresh();
    }
  };

  if (loading) return <div className="p-8 text-center">Chargement des demandes...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Validation des employés</h1>
      
      {pendingEmployees.length === 0 ? (
        <p className="text-gray-500 bg-white p-6 rounded-lg shadow-sm border">
          Aucun employé en attente pour le moment.
        </p>
      ) : (
        <div className="grid gap-4">
          {pendingEmployees.map((employee) => (
            <div key={employee.id} className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div>
                <p className="font-medium text-gray-900">{employee.nom || "Nom non renseigné"}</p>
                <p className="text-sm text-gray-500">{employee.email}</p>
              </div>
              
              {/* Le fameux bouton demandé dans les consignes */}
              <button
                onClick={() => handleAcceptEmployee(employee.id)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition"
              >
                Accepter cet employé
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}