// src/app/dashboard/(shell)/employee/RoleSwitcher.tsx
'use client'; 

import { useState } from 'react';
import { updateEmployeeRole } from '@/lib/actions/employeeActions';
import { toast } from 'sonner';

// Mise à jour du type pour inclure associate et owner comme requis
type UserRole = 'employee' | 'associate' | 'owner';

interface RoleSwitcherProps {
  employeeId: string;
  currentRole: UserRole;
}

export default function RoleSwitcher({ employeeId, currentRole }: RoleSwitcherProps) {
  const [role, setRole] = useState<UserRole>(currentRole);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const handleRoleChange = async (newRole: UserRole) => {
    setIsUpdating(true);
    
    // Promesse de toast pour une meilleure expérience utilisateur
    const promise = updateEmployeeRole(employeeId, newRole);

    toast.promise(promise, {
      loading: 'Mise à jour du rôle...',
      success: (data) => {
        if (data.success) {
          setRole(newRole);
          return data.message || 'Rôle mis à jour avec succès';
        } else {
          throw new Error(data.error || 'Une erreur est survenue');
        }
      },
      error: (err) => err.message,
      finally: () => setIsUpdating(false),
    });
  };

  return (
    <select 
      value={role} 
      onChange={(e) => handleRoleChange(e.target.value as UserRole)}
      disabled={isUpdating}
      className={`bg-white border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 ${
        isUpdating ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <option value="employee">Employé</option>
      <option value="associate">Co-propriétaire/Associé</option>
      <option value="owner">Propriétaire</option>
    </select>
  );
}