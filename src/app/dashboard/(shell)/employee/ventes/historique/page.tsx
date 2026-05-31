'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const ITEMS_PER_PAGE = 6;

type Sale = {
  id: string;
  created_at: string;
  total_fc: number;
  employee_name: string;
  items_count: number;
};

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setSales(data);
    setLoading(false);
  };

  const formatFC = (amount: number) => {
    return `${amount.toLocaleString()} FC`;
  };

  const totalPages = Math.ceil(sales.length / ITEMS_PER_PAGE);
  const paginatedSales = sales.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Chargement de l'historique...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Historique des ventes</h1>

      {sales.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Aucune vente enregistrée pour le moment.</p>
      ) : (
        <>
          <div className="space-y-3">
            {paginatedSales.map((sale) => (
              <div
                key={sale.id}
                className="bg-white p-4 rounded-lg shadow border flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">
                    {new Date(sale.created_at).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">Vendeur : {sale.employee_name}</p>
                  <p className="text-sm text-gray-500">{sale.items_count} produit(s)</p>
                </div>
                <div className="text-right font-bold text-lg text-green-600">
                  {formatFC(sale.total_fc)}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition"
              >
                ◀ Précédent
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} sur {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition"
              >
                Suivant ▶
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}