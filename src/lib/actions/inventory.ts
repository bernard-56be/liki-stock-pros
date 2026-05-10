'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';

export type Product = {
  id: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  salePrice: number;
  minPrice: number;
  imageUrl: string | null;
  stockAlerte: number;
  isLowStock: boolean;
};

/**
 * Récupère le boutique_id de l'utilisateur connecté
 */
async function getBoutiqueId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('boutique_id')
    .eq('id', user.id)
    .single();

  if (error || !profile?.boutique_id) {
    throw new Error('Boutique non trouvée pour cet utilisateur');
  }
  return profile.boutique_id;
}

/**
 * Récupère tous les produits de la boutique
 */
export async function getProducts(): Promise<{ success: boolean; data?: Product[]; error?: string }> {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('produits')
      .select('*')
      .eq('boutique_id', boutiqueId)
      .order('name');

    if (error) throw error;

    const products: Product[] = data.map((p) => ({
      id: p.id,
      name: p.name,
      quantity: p.quantity,
      purchasePrice: p.purchase_price,
      salePrice: p.sale_price,
      minPrice: p.min_price,
      imageUrl: p.image_url,
      stockAlerte: p.stock_alerte,
      isLowStock: p.quantity <= p.stock_alerte,
    }));

    return { success: true, data: products };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Upload une image dans le bucket Supabase
 */
async function uploadImage(file: File, boutiqueId: string): Promise<string | null> {
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
}

/**
 * Crée un nouveau produit
 */
export async function createProduct(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const name = formData.get('name') as string;
    const quantity = parseInt(formData.get('quantity') as string);
    const purchasePrice = parseFloat(formData.get('purchasePrice') as string);
    const salePrice = parseFloat(formData.get('salePrice') as string);
    const minPrice = parseFloat(formData.get('minPrice') as string);
    const stockAlerte = parseInt(formData.get('stockAlerte') as string);
    const imageFile = formData.get('image') as File | null;

    let imageUrl: string | null = null;
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadImage(imageFile, boutiqueId);
    }

    const { error } = await supabase.from('produts').insert({
      boutique_id: boutiqueId,
      name,
      quantity,
      purchase_price: purchasePrice,
      sale_price: salePrice,
      min_price: minPrice,
      stock_alerte: stockAlerte,
      image_url: imageUrl,
    });

    if (error) throw error;

    revalidatePath('/dashboard/owner/inventaire');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Met à jour un produit existant
 */
export async function updateProduct(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const quantity = parseInt(formData.get('quantity') as string);
    const purchasePrice = parseFloat(formData.get('purchasePrice') as string);
    const salePrice = parseFloat(formData.get('salePrice') as string);
    const minPrice = parseFloat(formData.get('minPrice') as string);
    const stockAlerte = parseInt(formData.get('stockAlerte') as string);
    const imageFile = formData.get('image') as File | null;
    const currentImageUrl = formData.get('currentImageUrl') as string | null;

    let imageUrl = currentImageUrl;
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadImage(imageFile, boutiqueId);
    }

    const { error } = await supabase
      .from('products')
      .update({
        name,
        quantity,
        purchase_price: purchasePrice,
        sale_price: salePrice,
        min_price: minPrice,
        stock_alerte: stockAlerte,
        image_url: imageUrl,
      })
      .eq('id', id)
      .eq('boutique_id', boutiqueId); // sécurité supplémentaire

    if (error) throw error;

    revalidatePath('/dashboard/owner/inventaire');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Supprime un produit
 */
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
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}