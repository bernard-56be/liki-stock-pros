"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SalesForm() {
  const supabase = createClient();
  
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const { data, error } = await supabase.rpc("process_sale", {
      p_product_id: productId,
      p_quantity: quantity,
      p_unit_price: unitPrice,
    });

    setLoading(false);

    if (error) {
      setMessage("Erreur : " + error.message);
      setIsError(true);
      return;
    }

    if (data.success) {
      setMessage("✅ " + data.message);
      setIsError(false);
      setProductId("");
      setQuantity(1);
      setUnitPrice(0);
    } else {
      setMessage("❌ " + data.message);
      setIsError(true);
    }
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">💰 Nouvelle Vente</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ID du Produit
          </label>
          <input
            type="text"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            placeholder="UUID du produit"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantité
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            min={1}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prix Unitaire ($)
          </label>
          <input
            type="number"
            value={unitPrice}
            onChange={(e) => setUnitPrice(Number(e.target.value))}
            step="0.01"
            min={0}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? "Enregistrement..." : "💸 Enregistrer la Vente"}
        </button>
      </form>

      {message && (
        <div
          className={`mt-4 p-4 rounded-lg text-center font-semibold ${
            isError
              ? "bg-red-100 text-red-700 border border-red-300"
              : "bg-green-100 text-green-700 border border-green-300"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}