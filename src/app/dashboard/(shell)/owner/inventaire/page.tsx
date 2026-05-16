'use client';

import {
  useState,
  useMemo,
  useCallback,
  useTransition,
  memo,
  useEffect,
} from 'react';
import Image from 'next/image';
import { Search, X, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnimatedSheet } from '@/components/ui/AnimatedSheet';
import { getProducts, createProduct, updateProduct, deleteProduct, type Product } from '@/lib/actions/inventory';

const ITEMS_PER_PAGE = 6;

// ---------- Composants optimisés ----------
const ProductRow = memo(function ProductRow({
  product,
  onEdit,
  onDelete,
}: {
  product: Product;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
}) {
  const formatFc = (value: number) => `${value.toLocaleString('fr-FR')} FC`;

  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-gray-100">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={40}
                height={40}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-200 text-xs text-gray-500">
                📦
              </div>
            )}
          </div>
          <span className="font-medium text-gray-900">{product.name}</span>
          {product.isLowStock && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              <AlertTriangle className="h-3 w-3" />
              Stock bas
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-center text-gray-600">{product.quantity}</td>
      <td className="px-4 py-3 text-right text-gray-600">{formatFc(product.purchasePrice)}</td>
      <td className="px-4 py-3 text-right text-gray-600">{formatFc(product.salePrice)}</td>
      <td className="px-4 py-3 text-right text-gray-600">{formatFc(product.minPrice)}</td>
      <td className="px-4 py-3 text-right text-gray-700">
        <div className="flex justify-end gap-2">
          <button
            onClick={() => onEdit(product)}
            className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-indigo-600"
            aria-label="Modifier"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(product.id)}
            className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-600"
            aria-label="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
});

const SearchBar = memo(function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder="Rechercher un produit..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm text-gray-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
      />
    </div>
  );
});

const Pagination = memo(function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between border-t border-gray-100 pt-4">
      <Button
        variant="primary"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Précédent
      </Button>
      <span className="text-sm font-semibold text-gray-500">
        Page {currentPage} sur {totalPages}
      </span>
      <Button
        variant="primary"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Suivant
      </Button>
    </div>
  );
});

// ---------- Formulaire avec upload d'image ----------
const ProductForm = memo(function ProductForm({
  product,
  onClose,
  onSave,
}: {
  product: Product | null;
  onClose: () => void;
  onSave: (formData: FormData) => Promise<void>;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(product?.imageUrl || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!product;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      // 1. VÉRIFICATION DE LA TAILLE (5 Mo max) AVANT TOUT
      if (file.size > 5 * 1024 * 1024) {
        alert("L'image est trop volumineuse et ne doit pas dépasser 5 Mo.");
        e.target.value = ''; // On vide l'input pour annuler l'importation
        setPreviewUrl(product?.imageUrl || null); // On remet l'ancienne image si elle existe
        return; // On arrête tout, on ne crée pas de prévisualisation
      }

      // 2. Si la taille est bonne, on crée la prévisualisation
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(product?.imageUrl || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    if (isEditing && product) {
      formData.append('id', product.id);
      if (product.imageUrl) formData.append('currentImageUrl', product.imageUrl);
    }
    await onSave(formData);
    setIsSubmitting(false);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <h2 className="text-xl font-semibold text-gray-600">
          {isEditing ? 'Modifier le produit' : 'Ajouter un produit'}
        </h2>
        <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
          <X className="h-5 w-5 text-gray-600" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nom</label>
          <input
            name="name"
            defaultValue={product?.name || ''}
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Quantité</label>
          <input
            type="number"
            name="quantity"
            defaultValue={product?.quantity || 0}
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Prix d&apos;achat (FC)</label>
          <input
            type="number"
            step="any"
            name="purchasePrice"
            defaultValue={product?.purchasePrice || 0}
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Prix de vente (FC)</label>
          <input
            type="number"
            step="any"
            name="salePrice"
            defaultValue={product?.salePrice || 0}
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Prix minimum (FC)</label>
          <input
            type="number"
            step="any"
            name="minPrice"
            defaultValue={product?.minPrice || 0}
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Seuil d&apos;alerte stock</label>
          <input
            type="number"
            name="stockAlerte"
            defaultValue={product?.stockAlerte || 5}
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Image du produit</label>
          <input
            type="file"
            accept="image/*"
            name="image"
            onChange={handleImageChange}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-500"
          />
          {previewUrl && (
            <div className="mt-2 flex justify-center">
              <div className="relative h-20 w-20 overflow-hidden rounded-md border">
                <Image
                  src={previewUrl}
                  alt="Aperçu"
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement...' : isEditing ? 'Appliquer' : 'Ajouter'}
        </Button>
      </form>
    </div>
  );
});

// ---------- Page principale ----------
export default function OwnerInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLoading, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Chargement initial
  useEffect(() => {
    startTransition(async () => {
      const result = await getProducts();
      if (result.success && result.data) {
        setProducts(result.data);
        setError(null);
      } else {
        setError(result.error || 'Erreur de chargement');
      }
    });
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const lower = searchTerm.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(lower));
  }, [products, searchTerm]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteProduct(id);
    if (result.success) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      const newFilteredLen = filteredProducts.length - 1;
      const newTotalPages = Math.ceil(newFilteredLen / ITEMS_PER_PAGE);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      } else if (newFilteredLen === 0) {
        setCurrentPage(1);
      }
    } else {
      setError(result.error || 'Erreur lors de la suppression');
    }
  }, [filteredProducts.length, currentPage]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setIsSheetOpen(true);
  };

  const handleSaveProduct = useCallback(async (formData: FormData) => {
    const action = editingProduct ? updateProduct : createProduct;
    const result = await action(formData);
    if (result.success) {
      // Rechargement complet pour rester synchrone (simple)
      const { data: freshProducts } = await getProducts();
      if (freshProducts) setProducts(freshProducts);
      setIsSheetOpen(false);
      setEditingProduct(null);
    } else {
      setError(result.error || 'Erreur lors de l’enregistrement');
    }
  }, [editingProduct]);

  const closeSheet = useCallback(() => {
    setIsSheetOpen(false);
    setEditingProduct(null);
  }, []);

  if (isLoading && products.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">Chargement des produits...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-red-600">Erreur : {error}</div>
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl">
      <Card className="border border-gray-100 bg-white/90 shadow-sm backdrop-blur-sm">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Inventaire</CardTitle>
            <p className="text-sm text-gray-600">
              Gestion des produits (recherche instantanée, pagination 6/page)
            </p>
          </div>
          <Button onClick={handleOpenCreate}>Ajouter un produit</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <SearchBar value={searchTerm} onChange={handleSearch} />

          {/* Version desktop */}
          <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white md:block">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Produit</th>
                  <th className="px-4 py-3 text-center font-semibold">Quantité</th>
                  <th className="px-4 py-3 text-right font-semibold">Prix d&apos;achat</th>
                  <th className="px-4 py-3 text-right font-semibold">Prix de vente</th>
                  <th className="px-4 py-3 text-right font-semibold">Prix minimum</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                  />
                ))}
                {paginatedProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      Aucun produit trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Version mobile - cartes */}
          <div className="grid gap-3 md:hidden">
            {paginatedProducts.map((product) => (
              <Card key={product.id} className="border border-gray-200 shadow-sm">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-gray-100">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-200 text-xs text-gray-500">
                          📦
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        {product.isLowStock && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500">Stock : {product.quantity}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                    <span className="font-bold text-gray-900">Achat :</span>
                    <span className="text-right font-medium text-gray-700">
                      {product.purchasePrice.toLocaleString()} FC
                    </span>
                    <span className="font-bold text-gray-900">Vente :</span>
                    <span className="text-right font-medium text-gray-700">
                      {product.salePrice.toLocaleString()} FC
                    </span>
                    <span className="font-bold text-gray-900">Minimum :</span>
                    <span className="text-right font-medium text-gray-700">
                      {product.minPrice.toLocaleString()} FC
                    </span>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(product)}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      Supprimer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {paginatedProducts.length === 0 && (
              <p className="py-8 text-center text-gray-500">Aucun produit trouvé</p>
            )}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </CardContent>
      </Card>

      <AnimatedSheet isOpen={isSheetOpen} onClose={closeSheet}>
        <ProductForm
          product={editingProduct}
          onClose={closeSheet}
          onSave={handleSaveProduct}
        />
      </AnimatedSheet>
    </section>
  );
}