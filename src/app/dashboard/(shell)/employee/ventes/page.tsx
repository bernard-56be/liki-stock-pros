'use client';

import { useState, useMemo, useCallback, memo, useEffect } from 'react';
import Image from 'next/image';
import { Search, Plus, Minus, Trash2, AlertTriangle, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getProducts, type Product } from '@/lib/actions/inventory';
import { processSale } from '@/lib/actions/process-sale';

type CartItem = {
  id: string;
  name: string;
  quantity: number;           // quantité demandée
  negotiatedPrice: number;    // prix unitaire négocié (FC)
  minPrice: number;           // prix minimum autorisé (pour validation)
  maxStock: number;           // stock maximum disponible
};

// Taux de change fictif (1 USD = 2200 FC) – à remplacer par valeur réelle plus tard
const EXCHANGE_RATE = 2200;

// ---------- Composants internes -----------
const ProductCard = memo(function ProductCard({
  product,
  onAddToCart,
}: {
  product: Product;
  onAddToCart: (product: Product) => void;
}) {
  const formatFc = (value: number) => `${value.toLocaleString('fr-FR')} FC`;

  return (
    <Card className="border border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-gray-100">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={56}
                height={56}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-200 text-lg">
                📦
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{product.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="font-medium text-indigo-600">{formatFc(product.salePrice)}</span>
              <span className="text-gray-600">Stock: {product.quantity}</span>
              {product.isLowStock && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                  <AlertTriangle className="h-3 w-3" />
                  Stock bas
                </span>
              )}
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddToCart(product)}
            disabled={product.quantity === 0}
            className="shrink-0"
          >
            <Plus className="mr-1 h-3 w-3" /> Ajouter
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

const CartItemRow = memo(function CartItemRow({
  item,
  onUpdateQuantity,
  onUpdatePrice,
  onRemove,
}: {
  item: CartItem;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onUpdatePrice: (id: string, price: number) => void;
  onRemove: (id: string) => void;
}) {
  const total = item.quantity * item.negotiatedPrice;
  const isPriceBelowMin = item.negotiatedPrice < item.minPrice;
  const isQuantityExceedStock = item.quantity > item.maxStock;

  return (
    <div className="border-b border-gray-100 py-3 last:border-0">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-gray-900">{item.name}</h4>
          <button
            onClick={() => onRemove(item.id)}
            className="rounded p-1 text-gray-400 hover:text-red-600 transition-colors"
            aria-label="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <label className="block text-xs text-gray-600">Quantité</label>
            <div className="flex items-center gap-1 mt-1 text-gray-700">
              <button
                onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                className="rounded border border-gray-300 p-1 hover:bg-gray-100"
              >
                <Minus className="h-3 w-3" />
              </button>
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 1) onUpdateQuantity(item.id, val);
                }}
                className="w-16 text-center"
                min={1}
                max={item.maxStock}
              />
              <button
                onClick={() => onUpdateQuantity(item.id, Math.min(item.maxStock, item.quantity + 1))}
                className="rounded border border-gray-300 p-1 hover:bg-gray-100"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            {isQuantityExceedStock && (
              <p className="text-xs text-red-500 mt-1">Stock max: {item.maxStock}</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500">Prix unitaire (FC)</label>
            <Input
              type="number"
              value={item.negotiatedPrice}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val >= 0) onUpdatePrice(item.id, val);
              }}
              className="mt-1 text-gray-700"
              min={0}
              step={100}
            />
            {isPriceBelowMin && (
              <p className="text-xs text-red-500 mt-1">
                Min autorisé: {item.minPrice.toLocaleString()} FC
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total ligne:</span>
          <span className="font-semibold text-gray-900">{total.toLocaleString()} FC</span>
        </div>
      </div>
    </div>
  );
});

// ---------- Page principale ----------
export default function EmployeeSalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Chargement des produits depuis Supabase
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      const result = await getProducts();
      if (result.success && result.data) {
        setProducts(result.data);
        setError(null);
      } else {
        setError(result.error || 'Erreur de chargement des produits');
      }
      setIsLoading(false);
    };
    loadProducts();
  }, []);

  // Filtrage des produits
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const lower = searchTerm.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(lower));
  }, [products, searchTerm]);

  // Ajout au panier
  const handleAddToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + 1, product.quantity);
        if (newQty === existing.quantity) return prev;
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          quantity: 1,
          negotiatedPrice: product.salePrice,
          minPrice: product.minPrice,
          maxStock: product.quantity,
        },
      ];
    });
  }, []);

  const handleUpdateQuantity = useCallback((id: string, quantity: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.min(quantity, item.maxStock) } : item
      )
    );
  }, []);

  const handleUpdatePrice = useCallback((id: string, price: number) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, negotiatedPrice: price } : item))
    );
  }, []);

  const handleRemove = useCallback((id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Calculs du panier
  const subtotalFc = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity * item.negotiatedPrice, 0);
  }, [cart]);

  const subtotalUsd = useMemo(() => subtotalFc / EXCHANGE_RATE, [subtotalFc]);

  const hasInvalidPrice = useMemo(() => {
    return cart.some((item) => item.negotiatedPrice < item.minPrice);
  }, [cart]);

  const hasStockExceed = useMemo(() => {
    return cart.some((item) => item.quantity > item.maxStock);
  }, [cart]);

  const isCartEmpty = cart.length === 0;

  // Validation finale : appel à processSale pour chaque article
  const handleCheckout = useCallback(async () => {
    if (hasInvalidPrice) {
      setError('Certains produits ont un prix inférieur au prix minimum autorisé.');
      return;
    }
    if (hasStockExceed) {
      setError('La quantité demandée dépasse le stock disponible pour certains produits.');
      return;
    }
    if (isCartEmpty) {
      setError('Le panier est vide.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    // On envoie chaque article un par un
    let hasError = false;
    for (const item of cart) {
      const result = await processSale(item.id, item.quantity, item.negotiatedPrice);
      if (!result.success) {
        setError(`Erreur pour ${item.name} : ${result.message}`);
        hasError = true;
        break;
      }
    }

    if (!hasError) {
      setSuccessMessage('Vente finalisée avec succès !');
      // Vider le panier
      setCart([]);
      // Recharger les produits pour mettre à jour les stocks
      const refreshed = await getProducts();
      if (refreshed.success && refreshed.data) {
        setProducts(refreshed.data);
      }
      // Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccessMessage(null), 3000);
    }

    setIsSubmitting(false);
  }, [cart, hasInvalidPrice, hasStockExceed, isCartEmpty]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">Chargement des produits...</div>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-red-600">Erreur : {error}</div>
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Colonne gauche : produits */}
        <div className="flex-1 space-y-4">
          <Card className="border border-gray-100 bg-white/90 shadow-sm backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle>Produits disponibles</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm text-gray-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredProducts.length === 0 ? (
                <p className="py-8 text-center text-gray-500">Aucun produit trouvé</p>
              ) : (
                filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonne droite : panier */}
        <div className="w-full lg:w-96">
          <Card className="sticky top-20 border border-gray-100 bg-white/90 shadow-sm backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Panier
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <p className="py-8 text-center text-gray-600">Aucun article dans le panier</p>
              ) : (
                <>
                  <div className="max-h-96 overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <CartItemRow
                        key={item.id}
                        item={item}
                        onUpdateQuantity={handleUpdateQuantity}
                        onUpdatePrice={handleUpdatePrice}
                        onRemove={handleRemove}
                      />
                    ))}
                  </div>
                  <div className="border-t border-gray-200 pt-3 space-y-2">
                    <div className="flex justify-between text-base font-semibold">
                      <span>Total (FC):</span>
                      <span>{subtotalFc.toLocaleString()} FC</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Total (USD):</span>
                      <span>{subtotalUsd.toFixed(2)} $</span>
                    </div>
                    {hasInvalidPrice && (
                      <div className="flex items-center gap-2 rounded-lg bg-red-50 p-2 text-sm text-red-700">
                        <AlertTriangle className="h-4 w-4" />
                        Certains prix sont en dessous du minimum autorisé
                      </div>
                    )}
                    {hasStockExceed && (
                      <div className="flex items-center gap-2 rounded-lg bg-red-50 p-2 text-sm text-red-700">
                        <AlertTriangle className="h-4 w-4" />
                        Quantité supérieure au stock disponible
                      </div>
                    )}
                    {error && (
                      <div className="rounded-lg bg-red-50 p-2 text-sm text-red-700">
                        {error}
                      </div>
                    )}
                    {successMessage && (
                      <div className="rounded-lg bg-green-50 p-2 text-sm text-green-700">
                        {successMessage}
                      </div>
                    )}
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={handleCheckout}
                      disabled={hasInvalidPrice || hasStockExceed || isCartEmpty || isSubmitting}
                    >
                      {isSubmitting ? 'Traitement...' : 'Finaliser la vente'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}