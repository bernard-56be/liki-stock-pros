import { getEmployeesFromDatabase, Employee } from '@/lib/actions/employee-actions';
import RoleSwitcher from '../(shell)/employee/RoleSwitcher';


// 2. Transformation en Server Component (Next.js App Router)
// Les pages ne doivent pas prendre de props comme 'initialEmployees' directement.
export default async function ManageEmployeesPage() {
  
  // 3. Récupération des données typées ici (exemple avec une fonction fictive)
  const employees: Employee[] = await getEmployeesFromDatabase();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gestion des employés</h1>
      <table className="w-full border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th className="p-3 border">Nom</th>
            <th className="p-3 border">Rôle Actuel</th>
            <th className="p-3 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {/* 4. Typage strict de 'emp' dans le map */}
          {employees.map((emp: Employee) => (
            <tr key={emp.id}>
              <td className="p-3 border">{emp.full_name}</td>
              <td className="p-3 border">{emp.role}</td>
              <td className="p-3 border">
                <RoleSwitcher 
                  employeeId={emp.id} 
                  currentRole={emp.role} 
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}