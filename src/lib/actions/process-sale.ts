"use server";

import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/actions/notifications";

export async function processSale(
  productId: string,
  quantity: number,
  unitPrice: any,
  saleCurrency: "USD" | "CDF" = "CDF"
) {
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, message: "Vous devez être connecté." };
    }

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
      return { success: false, message: "Taux de change invalide." };
    }

    const exchangeRate = boutique.exchange_rate;
    let finalUnitPriceForRpc = parsedPrice;
    
    if (saleCurrency === "CDF") {
      finalUnitPriceForRpc = parsedPrice / exchangeRate;
    }

    // Appel RPC
    const { data, error } = await supabase.rpc("process_sale", {
      p_product_id: productId,
      p_quantity: Math.floor(cleanQuantity),
      p_unit_price: Number(finalUnitPriceForRpc.toFixed(4)),
      p_exchange_rate: Number(exchangeRate),
    });

    if (error) {
      console.error("Erreur RPC :", error);
      return { success: false, message: `Erreur base de données : ${error.message}` };
    }

    if (data.success) {
      const newStock = data.new_stock;

      // Correction ici : on sélectionne "stock_alerte" au lieu de "min_stock"
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("name, stock_alerte, boutique_id")
        .eq("id", productId)
        .single();

      if (!productError && product && newStock !== undefined && newStock !== null) {
        const seuilCritique = product.stock_alerte; // Alignement schéma
        
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
              `Le produit "${product.name}" est presque en rupture. Restant : ${newStock} unité(s).`,
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
    console.error("Exception :", err);
    return { success: false, message: "Une erreur inattendue est survenue." };
  }
}