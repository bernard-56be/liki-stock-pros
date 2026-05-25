import SalesForm from "@/components/dashboard/sales-form";

export default function VentesPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          💼 Interface de Vente
        </h1>
        <p className="text-gray-500 mb-6">
          Enregistrez une nouvelle vente. Le prix minimum sera vérifié automatiquement.
        </p>
        <SalesForm />
      </div>
    </div>
  );
}