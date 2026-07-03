import { getEmployeesFromDatabase, removeAndDestroyEmployee } from "@/lib/actions/employee-actions";

export default async function ManageEmployeesPage() {
  const employees = await getEmployeesFromDatabase();

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-8">
      {/* En-tête de la page */}
      <div>
        <h1 className="text-[28px] font-bold text-[#0A1629] tracking-tight">
          Gestion des employés
        </h1>
      </div>

      {/* Conteneur principal */}
      <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden min-h-75 flex flex-col justify-center">
        {employees.length === 0 ? (
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
          <div className="overflow-x-auto w-full align-middle">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="py-4 px-6 text-xs font-bold text-[#4A5568] uppercase tracking-widest">
                    Nom complet
                  </th>
                  <th className="py-4 px-6 text-xs font-bold text-[#4A5568] uppercase tracking-widest">
                    Rôle
                  </th>
                  <th className="py-4 px-6 text-xs font-bold text-right text-[#4A5568] uppercase tracking-widest">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((employee) => {
                  // ON PRÉPARE L'ACTION ICI AVEC LA NOUVELLE FONCTION ET L'ID DE L'EMPLOYÉ
                  const deleteAction = removeAndDestroyEmployee.bind(null, employee.id);

                  return (
                    <tr key={employee.id} className="hover:bg-slate-50/40 transition-colors group">
                      <td className="py-4 px-6 text-[15px] font-medium text-[#0A1629]">
                        {employee.full_name}
                      </td>

                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#9D00E7]/10 text-[#9D00E7] capitalize tracking-wide">
                          {employee.role === 'employee' ? 'Employé' : employee.role}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <form action={deleteAction}>
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 border border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 rounded-xl shadow-sm transition-all duration-200 active:transform active:scale-95 cursor-pointer"
                          >
                            <svg 
                              className="w-4 h-4 opacity-70 group-hover:text-red-500 transition-colors" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <path d="M3 6h18" />
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
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