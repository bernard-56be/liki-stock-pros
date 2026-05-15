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
 * Récupère le boutique_id depuis le profil de l'utilisateur
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
    throw new Error('Boutique non trouvée dans votre profil. Assurez-vous d\'être lié à une boutique.');
  }
  return profile.boutique_id;
}

/**
 * Récupère tous les produits (Table: products)
 */
export async function getProducts(): Promise<{ success: boolean; data?: Product[]; error?: string }> {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('products') // Correction du nom de la table
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
 * Upload d'image
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
 * Ajouter un produit
 */
export async function createProduct(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const imageFile = formData.get('image') as File | null;
    let imageUrl: string | null = null;
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadImage(imageFile, boutiqueId);
    }

    const { error } = await supabase.from('products').insert({
      boutique_id: boutiqueId,
      name: formData.get('name') as string,
      quantity: parseInt(formData.get('quantity') as string) || 0,
      purchase_price: parseFloat(formData.get('purchasePrice') as string) || 0,
      sale_price: parseFloat(formData.get('salePrice') as string) || 0,
      min_price: parseFloat(formData.get('minPrice') as string) || 0,
      stock_alerte: parseInt(formData.get('stockAlerte') as string) || 5,
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
 * Modifier un produit
 */
export async function updateProduct(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const boutiqueId = await getBoutiqueId();
    const supabase = await createClient();

    const id = formData.get('id') as string;
    const imageFile = formData.get('image') as File | null;
    const currentImageUrl = formData.get('currentImageUrl') as string | null;

    let imageUrl = currentImageUrl;
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadImage(imageFile, boutiqueId);
    }

    const { error } = await supabase
      .from('products')
      .update({
        name: formData.get('name') as string,
        quantity: parseInt(formData.get('quantity') as string),
        purchase_price: parseFloat(formData.get('purchasePrice') as string),
        sale_price: parseFloat(formData.get('salePrice') as string),
        min_price: parseFloat(formData.get('minPrice') as string),
        stock_alerte: parseInt(formData.get('stockAlerte') as string),
        image_url: imageUrl,
      })
      .eq('id', id)
      .eq('boutique_id', boutiqueId);

    if (error) throw error;

    revalidatePath('/dashboard/owner/inventaire');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Supprimer un produit
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