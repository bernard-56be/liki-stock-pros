'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';

// 1. AJOUT DE LA CURRENCY DANS LE TYPE PRINCIPAL
export type Product = {
  id: string;
  name: string;
  quantity: number;
  currency: 'USD' | 'CDF'; // <-- Ajouté ici
  purchasePrice: number;
  salePrice: number;
  minPrice: number;
  imageUrl: string | null;
  stockAlerte: number;
  isLowStock: boolean;
};

/**
 * Récupère le boutique_id de l'utilisateur connecté.
 */
async function getBoutiqueId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Non authentifié');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('boutique_id')
    .eq('id', user.id)
    .single();

  if (!profileError && profile?.boutique_id) {
    return profile.boutique_id;
  }

  const { data: boutique, error: boutiqueError } = await supabase
    .from('boutiques')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (boutiqueError || !boutique) {
    console.error('getBoutiqueId - profileError:', profileError);
    console.error('getBoutiqueId - boutiqueError:', boutiqueError);
    throw new Error('Aucune boutique associée à ce compte.');
  }

  return boutique.id;
}

export async function getProducts(): Promise<{ 
  success: boolean; 
  data?: Product[]; 
  exchangeRate?: number; // <-- Ajout du taux de change dans la réponse
  error?: string 
}> {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    // 1. Récupération des produits
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('boutique_id', boutiqueId)
      .order('name');

    if (productsError) throw productsError;

    // 2. Récupération dynamique du taux de change de la boutique
    const { data: boutiqueData, error: boutiqueError } = await supabase
      .from('boutiques')
      .select('taux_change')
      .eq('id', boutiqueId)
      .single();

    // Fallback à 2850 si aucun taux n'est configuré ou s'il y a une erreur mineure
    const currentRate = !boutiqueError && boutiqueData?.taux_change ? Number(boutiqueData.taux_change) : 2850;

    // 3. Extraction et mapping de la devise depuis la table
    const products: Product[] = productsData.map((p) => ({
      id: p.id,
      name: p.name,
      quantity: p.quantity,
      currency: p.currency || 'USD',
      purchasePrice: p.purchase_price,
      salePrice: p.sale_price,
      minPrice: p.min_price,
      imageUrl: p.image_url,
      stockAlerte: p.stock_alerte,
      isLowStock: p.quantity <= p.stock_alerte,
    }));

    return { success: true, data: products, exchangeRate: currentRate };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Erreur lors de la récupération des produits";
    console.error('getProducts error:', err);
    return { success: false, error: errorMessage };
  }
}

async function uploadImage(file: File, boutiqueId: string): Promise<string | null> {
  try {
    const supabase = await createClient();
    const ext = file.name.split('.').pop();
    const fileName = `${boutiqueId}/${randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('uploadImage exception:', err);
    return null;
  }
}

export async function createProduct(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const name = formData.get('name') as string;
    if (!name?.trim()) {
      return { success: false, error: 'Le nom du produit est obligatoire.' };
    }

    const quantity = parseInt(formData.get('quantity') as string) || 0;
    const currency = (formData.get('currency') as string) || 'USD'; // <-- Récupération de la devise
    const purchasePrice = parseFloat(formData.get('purchasePrice') as string) || 0;
    const salePrice = parseFloat(formData.get('salePrice') as string) || 0;
    const minPrice = parseFloat(formData.get('minPrice') as string) || 0;
    
    // VALIDATION STRICTE DES PRIX : Blocage de sécurité Serveur
    if (salePrice > 0 && minPrice >= salePrice) {
      return { success: false, error: "Validation échouée : Le prix minimum doit être strictement inférieur au prix de vente." };
    }
    
    // Correction ici : prend en charge soit 'min_stock' (formulaire) soit 'stockAlerte'
    const stockAlerte = parseInt(formData.get('min_stock') as string) || 
                        parseInt(formData.get('stockAlerte') as string) || 5;

    const imageFile = formData.get('image') as File | null;
    const currentImageUrl = formData.get('currentImageUrl') as string | null;

    let imageUrl = currentImageUrl;

    if (imageFile && imageFile.size > 0) {
      if (imageFile.size > 5 * 1024 * 1024) {
        throw new Error("L'image est trop volumineuse et ne doit pas dépasser 5 Mo");
      }
      imageUrl = await uploadImage(imageFile, boutiqueId);
    }

    // 3. INSERTION DE LA DEVISE DANS LA TABLE SUPABASE
    const { error } = await supabase.from('products').insert({
      boutique_id: boutiqueId,
      name: name.trim(),
      quantity,
      currency, // <-- Sauvegardé en base de données !
      purchase_price: purchasePrice,
      sale_price: salePrice,
      min_price: minPrice,
      stock_alerte: stockAlerte,
      image_url: imageUrl,
    });

    if (error) throw error;

    revalidatePath('/dashboard/owner/inventaire');
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Erreur lors de la création du produit";
    console.error('createProduct error:', err);
    return { success: false, error: errorMessage };
  }
}

export async function updateProduct(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const id = formData.get('id') as string;
    if (!id) return { success: false, error: 'ID produit manquant.' };

    const name = formData.get('name') as string;
    const quantity = parseInt(formData.get('quantity') as string) || 0;
    const currency = (formData.get('currency') as string) || 'USD'; // <-- Récupération de la devise
    const purchasePrice = parseFloat(formData.get('purchasePrice') as string) || 0;
    const salePrice = parseFloat(formData.get('salePrice') as string) || 0;
    const minPrice = parseFloat(formData.get('minPrice') as string) || 0;
    
    // VALIDATION STRICTE DES PRIX 
    if (salePrice > 0 && minPrice >= salePrice) {
      return { success: false, error: "Validation échouée : Le prix minimum doit être strictement inférieur au prix de vente." };
    }
    
    const stockAlerte = parseInt(formData.get('min_stock') as string) || 
                        parseInt(formData.get('stockAlerte') as string) || 5;
                        
    const currentImageUrl = formData.get('currentImageUrl') as string | null;
    const imageFile = formData.get('image') as File | null;

    let imageUrl = currentImageUrl;

    if (imageFile && imageFile.size > 0) {
      if (imageFile.size > 5 * 1024 * 1024) {
        throw new Error("L'image est trop volumineuse et ne doit pas dépasser 5 Mo");
      }
      imageUrl = await uploadImage(imageFile, boutiqueId);
    }

    // 4. MISE À JOUR DE LA DEVISE DANS LA TABLE SUPABASE
    const { error } = await supabase
      .from('products')
      .update({
        name: name.trim(),
        quantity,
        currency, // <-- Sauvegardé en base de données !
        purchase_price: purchasePrice,
        sale_price: salePrice,
        min_price: minPrice,
        stock_alerte: stockAlerte,
        image_url: imageUrl,
      })
      .eq('id', id)
      .eq('boutique_id', boutiqueId);

    if (error) throw error;

    revalidatePath('/dashboard/owner/inventaire');
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Erreur lors de la mise à jour";
    console.error('updateProduct error:', err);
    return { success: false, error: errorMessage };
  }
}

export async function deleteProduct(productId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('boutique_id', boutiqueId);

    if (error) throw error;

    revalidatePath('/dashboard/owner/inventaire');
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Erreur lors de la suppression";
    console.error('deleteProduct error:', err);
    return { success: false, error: errorMessage };
  }
}