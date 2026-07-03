import { getEmployeesFromDatabase, revokeEmployee } from "@/lib/actions/employee-actions";

export default async function ManageEmployeesPage() {
  const employees = await getEmployeesFromDatabase();

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-8">
      {/* En-tête identique à la page de Validation */}
      <div>
        <h1 className="text-[28px] font-bold text-[#0A1629] tracking-tight">
          Gestion des employés
        </h1>
      </div>

      {/* Conteneur principal (Même carte blanche avec ombre douce et angles arrondis) */}
      <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden min-h-75 flex flex-col justify-center">
        {employees.length === 0 ? (
          /* État vide calqué sur le style de ton image_b34467.png */
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
              <svg 
                className="w-6 h-6 text-[#22C55E]" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-[#4A5568] text-[17px] font-medium">
              Aucun employé actif dans votre boutique.
            </p>
          </div>
        ) : (
          /* Tableau des employés si des profils sont présents */
          <div className="overflow-x-auto w-full align-middle">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="p-5 text-sm font-semibold text-[#4A5568] uppercase tracking-wider">
                    Nom complet
                  </th>
                  <th className="p-5 text-sm font-semibold text-[#4A5568] uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="p-5 text-sm font-semibold text-right text-[#4A5568] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((employee) => {
                  // Préparation sécurisée de la Server Action liée à l'ID de cet employé spécifique
                  const revokeEmployeeAction = revokeEmployee.bind(null, employee.id);

                  return (
                    <tr key={employee.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-5 text-[16px] font-medium text-[#0A1629]">
                        {employee.full_name}
                      </td>
                      <td className="p-5">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#9D00E7]/10 text-[#9D00E7] capitalize">
                          {employee.role === 'employee' ? 'Employé' : employee.role}
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        {/* Utilisation directe de l'action préparée */}
                        <form action={revokeEmployeeAction}>
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 hover:text-white border border-red-200 hover:border-red-500 hover:bg-red-500 rounded-xl transition-all shadow-sm active:transform active:scale-95 cursor-pointer"
                          >
                            Retirer de la boutique
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}