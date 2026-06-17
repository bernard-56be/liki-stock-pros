"use server";

import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/actions/services/notificationService";

export async function processSale(
  productId: string,
  quantity: number,
  unitPrice: any,
  saleCurrency: "USD" | "CDF" = "CDF"
) {
  // 1. Validations de base côté serveur avant l'appel à la base de données
  if (!productId || typeof productId !== "string") {
    return { success: false, message: "Produit invalide." };
  }

  const cleanQuantity = Number(quantity);
  if (!cleanQuantity || cleanQuantity <= 0 || !Number.isInteger(cleanQuantity)) {
    return { success: false, message: "Quantité invalide." };
  }

  let parsedPrice = typeof unitPrice === "string" 
    ? Number(unitPrice.replace(",", ".")) 
    : Number(unitPrice);

  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    return { success: false, message: "Prix invalide." };
  }

  if (cleanQuantity > 1000) {
    return { success: false, message: "Quantité trop élevée (max 1000)." };
  }

  try {
    const supabase = await createClient();

    // 2. Vérification de l'authentification de l'employé
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, message: "Vous devez être connecté pour effectuer une vente." };
    }

    // 3. Récupération de la boutique de l'employé pour obtenir le taux de change réel
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("boutique_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.boutique_id) {
      return { success: false, message: "Profil sans boutique associée." };
    }

    const { data: boutique, error: boutiqueError } = await supabase
      .from("boutiques")
      .select("exchange_rate")
      .eq("id", profile.boutique_id)
      .single();

    if (boutiqueError || !boutique?.exchange_rate || boutique.exchange_rate <= 0) {
      return { success: false, message: "Taux de change de la boutique invalide ou non défini." };
    }

    const exchangeRate = boutique.exchange_rate;

    // 4. Appel de la fonction RPC mise à jour avec la devise et le taux de change
    const { data, error } = await supabase.rpc("process_sale", {
      p_product_id: productId,
      p_quantity: cleanQuantity,
      p_unit_price: parsedPrice,
      p_exchange_rate: exchangeRate,
      p_currency: saleCurrency 
    });

    if (error) {
      console.error("Erreur RPC Supabase :", error);
      return { 
        success: false, 
        message: error.message || "Erreur serveur lors de la validation SQL." 
      };
    }

    // 5. Gestion des alertes de stock critique (Notification automatique au propriétaire)
    if (data.success) {
      const newStock = data.new_stock;

      const { data: product, error: productError } = await supabase
        .from("products")
        .select("name, stock_alerte, boutique_id")
        .eq("id", productId)
        .single();

      if (!productError && product && newStock !== undefined && newStock !== null) {
        const seuilCritique = product.stock_alerte;
        
        if (newStock <= seuilCritique) {
          const { data: boutiqueOwner, error: ownerError } = await supabase
            .from("boutiques")
            .select("owner_id")
            .eq("id", product.boutique_id)
            .single();

          if (!ownerError && boutiqueOwner?.owner_id) {
            try {
              // Appelle le service mis à jour qui tourne maintenant avec l'Admin Client
              await createNotification(
                boutiqueOwner.owner_id,
                "Stock critique",
                `Le produit "${product.name}" est presque en rupture. Restant : ${newStock} unité(s).`,
                "danger"
              );
            } catch (notifError) {
              // Évite de faire planter l'achat du client si le système de notif est surchargé
              console.error("Échec de l'envoi de la notification en arrière-plan:", notifError);
            }
          }
        }
      }
    }

    // 6. Retour de la réponse unifiée au panier Front-end
    return {
      success: data.success,
      message: data.message,
      sale_id: data.sale_id || null,
      total_amount: data.total_amount || null,
      new_stock: data.new_stock || null,
    };
    
  } catch (err) {
    console.error("Exception interceptée dans process_sale :", err);
    return { success: false, message: "Une erreur inattendue est survenue." };
  }
}