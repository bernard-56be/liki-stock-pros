'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { History, Clock } from 'lucide-react';

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
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-gray-200 border-t-purple-500 animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-50 rounded-xl">
          <History className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historique des ventes</h1>
          <p className="text-sm text-gray-500">
            Consultez l'historique des ventes de votre boutique
          </p>
        </div>
      </div>

      {/* Contenu */}
      {sales.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
            <Clock className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">Aucune vente</h3>
          <p className="text-sm text-gray-500">
            Aucune vente enregistrée pour le moment.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginatedSales.map((sale) => (
              <div
                key={sale.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex justify-between items-center hover:shadow-md transition-shadow"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    {new Date(sale.created_at).toLocaleString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p className="text-sm text-gray-500">Vendeur : {sale.employee_name}</p>
                  <p className="text-sm text-gray-400">{sale.items_count} produit(s)</p>
                </div>
                <div className="text-right font-bold text-lg text-purple-700">
                  {formatFC(sale.total_fc)}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition"
              >
                ◀ Précédent
              </button>
              <span className="text-sm text-gray-500 font-medium">
                Page {currentPage} sur {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition"
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