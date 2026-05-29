export interface DailyRevenue {
  date: string;
  boutique_id: string;
  chiffre_affaires: number;
  benefice_net: number;
}

export interface TopProduitVendu {
  product_id: string;
  product_name: string;
  total_vendus: number;
}
