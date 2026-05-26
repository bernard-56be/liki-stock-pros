"use server";

import { createClient } from "@/lib/supabase/server";

export async function processSale(
  productId: string,
  quantity: number,
  unitPrice: number
) {
  // 1. Vérifications de base côté serveur avant même d'appeler Supabase
  if (!productId || typeof productId !== "string") {
    return {
      success: false,
      message: "Produit invalide. Veuillez sélectionner un produit.",
    };
  }

  if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
    return {
      success: false,
      message: "Quantité invalide. Veuillez entrer un nombre entier positif.",
    };
  }

  if (!unitPrice || unitPrice <= 0) {
    return {
      success: false,
      message: "Prix invalide. Veuillez entrer un prix positif.",
    };
  }

  if (quantity > 1000) {
    return {
      success: false,
      message: "Quantité trop élevée. Maximum 1000 unités par vente.",
    };
  }

  try {
    const supabase = await createClient();

    // 2. Vérifier que l'utilisateur est bien connecté
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: "Vous devez être connecté pour effectuer une vente.",
      };
    }

    // 3. Appeler la fonction process_sale dans Supabase
    const { data, error } = await supabase.rpc("process_sale", {
      p_product_id: productId,
      p_quantity: quantity,
      p_unit_price: unitPrice,
    });

    if (error) {
      console.error("Erreur process_sale :", error);
      return {
        success: false,
        message: "Erreur serveur lors de la vente. Veuillez réessayer.",
      };
    }

    // 4. Retourner le résultat exact de la fonction SQL
    return {
      success: data.success,
      message: data.message,
      sale_id: data.sale_id || null,
      total_amount: data.total_amount || null,
      new_stock: data.new_stock || null,
    };
  } catch (err) {
    console.error("Exception process_sale :", err);
    return {
      success: false,
      message:
        "Une erreur inattendue est survenue. Veuillez contacter le propriétaire.",
    };
  }
}