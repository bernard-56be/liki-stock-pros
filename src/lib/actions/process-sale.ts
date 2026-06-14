"use server";

import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/actions/notifications";

export async function processSale(
  productId: string,
  quantity: number,
  unitPrice: number
) {
  // Empêche les requêtes malformées de passer côté serveur
  if (!productId || typeof productId !== "string") {
    return {
      success: false,
      message: "Produit invalide. Veuillez sélectionner un produit.",
    };
  }

  // Sécurise la quantité pour éviter les valeurs négatives ou décimales non prévues
  if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
    return {
      success: false,
      message: "Quantité invalide. Veuillez entrer un nombre entier positif.",
    };
  }

  // Garantit que la transaction a une valeur financière réelle
  if (!unitPrice || unitPrice <= 0) {
    return {
      success: false,
      message: "Prix invalide. Veuillez entrer un prix positif.",
    };
  }

  // Limite de sécurité pour éviter les abus ou erreurs de saisie massives
  if (quantity > 1000) {
    return {
      success: false,
      message: "Quantité trop élevée. Maximum 1000 unités par vente.",
    };
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // Rejette l'opération si la session est expirée ou invalide
    if (authError || !user) {
      return {
        success: false,
        message: "Vous devez être connecté pour effectuer une vente.",
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("boutique_id")
      .eq("id", user.id)
      .single();

    // Lie l'employé à son point de vente physique
    if (profileError || !profile?.boutique_id) {
      return {
        success: false,
        message: "Profil sans boutique associée.",
      };
    }

    const { data: boutique, error: boutiqueError } = await supabase
      .from("boutiques")
      .select("exchange_rate")
      .eq("id", profile.boutique_id)
      .single();

    // Bloque la vente si le taux récupéré en BDD a expiré ou est invalide
    if (boutiqueError || !boutique?.exchange_rate || boutique.exchange_rate <= 0) {
      return {
        success: false,
        message: "Taux de change invalide ou non défini. Contactez le propriétaire.",
      };
    }

    const exchangeRate = boutique.exchange_rate;

    // Historise le taux exact appliqué à cette transaction pour la clôture de caisse
    const { data, error } = await supabase.rpc("process_sale", {
      p_product_id: productId,
      p_quantity: quantity,
      p_unit_price: unitPrice,
      p_exchange_rate: exchangeRate,
    });

    if (error) {
      console.error("Erreur process_sale :", error);
      return {
        success: false,
        message: "Erreur serveur lors de la vente. Veuillez réessayer.",
      };
    }

    if (data.success) {
      const newStock = data.new_stock;

      const { data: product, error: productError } = await supabase
        .from("products")
        .select("name, min_stock, boutique_id")
        .eq("id", productId)
        .single();

      if (!productError && product) {
        // Alerte le propriétaire avant la rupture totale en se basant sur le seuil défini
        const seuilCritique = product.min_stock;
        
        if (newStock <= seuilCritique) {
          const { data: boutiqueOwner, error: ownerError } = await supabase
            .from("boutiques")
            .select("owner_id")
            .eq("id", product.boutique_id)
            .single();

          if (!ownerError && boutiqueOwner?.owner_id) {
            await createNotification(
              boutiqueOwner.owner_id,
              "Stock critique",
              `Le produit "${product.name}" est presque en rupture. Stock restant : ${newStock} unité(s).`,
              "danger"
            );
          }
        }
      }
    }

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