'use client';

import {
  useState,
  useMemo,
  useCallback,
  useTransition,
  memo,
} from 'react';
import Image from 'next/image';
import { Search, X, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// ---------- Types ----------
type Product = {
  id: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  salePrice: number;
  minPrice: number;
  imageUrl: string;
};

// ---------- Données mockées ----------
const initialProducts: Product[] = [
  {
    id: 'P-001',
    name: 'Riz Premium 25kg',
    quantity: 18,
    purchasePrice: 58000,
    salePrice: 65000,
    minPrice: 61000,
    imageUrl: 'https://picsum.photos/id/1/80/80',
  },
  {
    id: 'P-002',
    name: 'Huile végétale 5L',
    quantity: 7,
    purchasePrice: 9200,
    salePrice: 11000,
    minPrice: 10000,
    imageUrl: 'https://picsum.photos/id/2/80/80',
  },
  {
    id: 'P-003',
    name: 'Sucre blanc 1kg',
    quantity: 42,
    purchasePrice: 1350,
    salePrice: 1700,
    minPrice: 1550,
    imageUrl: 'https://picsum.photos/id/3/80/80',
  },
  {
    id: 'P-004',
    name: 'Savon lessive (lot x12)',
    quantity: 4,
    purchasePrice: 7600,
    salePrice: 9300,
    minPrice: 8600,
    imageUrl: 'https://picsum.photos/id/4/80/80',
  },
  {
    id: 'P-005',
    name: 'Farine de maïs 25kg',
    quantity: 23,
    purchasePrice: 45000,
    salePrice: 52000,
    minPrice: 49000,
    imageUrl: 'https://picsum.photos/id/5/80/80',
  },
  {
    id: 'P-006',
    name: 'Tomates concentrées 70g',
    quantity: 120,
    purchasePrice: 450,
    salePrice: 600,
    minPrice: 550,
    imageUrl: 'https://picsum.photos/id/6/80/80',
  },
  {
    id: 'P-007',
    name: 'Pâtes alimentaires 500g',
    quantity: 85,
    purchasePrice: 850,
    salePrice: 1200,
    minPrice: 1100,
    imageUrl: 'https://picsum.photos/id/7/80/80',
  },
  {
    id: 'P-008',
    name: 'Lait en poudre 400g',
    quantity: 31,
    purchasePrice: 4200,
    salePrice: 5500,
    minPrice: 5100,
    imageUrl: 'https://picsum.photos/id/8/80/80',
  },
  {
    id: 'P-009',
    name: 'Œufs (plateau 30)',
    quantity: 15,
    purchasePrice: 4800,
    salePrice: 6000,
    minPrice: 5700,
    imageUrl: 'https://picsum.photos/id/9/80/80',
  },
  {
    id: 'P-010',
    name: 'Poulet entier congelé',
    quantity: 9,
    purchasePrice: 12500,
    salePrice: 15500,
    minPrice: 14800,
    imageUrl: 'https://picsum.photos/id/10/80/80',
  },
  {
    id: 'P-011',
    name: 'Poisson fumé (kg)',
    quantity: 22,
    purchasePrice: 9800,
    salePrice: 12500,
    minPrice: 11800,
    imageUrl: 'https://picsum.photos/id/11/80/80',
  },
];

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
            <Image
              src={product.imageUrl}
              alt={product.name}
              width={40}
              height={40}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <span className="font-medium text-gray-900">{product.name}</span>
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
      <span className="text-sm text-gray-500 font-semibold">
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

const ProductSheet = memo(function ProductSheet({
  isOpen,
  onClose,
  product,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSave: (product: Product) => void;
}) {
  // Le formulaire s'initialise directement avec les valeurs de 'product' si elles existent
  const [form, setForm] = useState<Partial<Product>>(
    product || {
      name: '',
      quantity: 0,
      purchasePrice: 0,
      salePrice: 0,
      minPrice: 0,
      imageUrl: 'https://picsum.photos/id/20/80/80',
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) return;
    const newProduct: Product = {
      id: product?.id || crypto.randomUUID(),
      name: form.name.trim(),
      quantity: form.quantity ?? 0,
      purchasePrice: form.purchasePrice ?? 0,
      salePrice: form.salePrice ?? 0,
      minPrice: form.minPrice ?? 0,
      imageUrl: form.imageUrl || 'https://picsum.photos/id/20/80/80',
    };
    onSave(newProduct);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md transform overflow-y-auto bg-white shadow-xl transition-transform duration-300">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-xl font-semibold text-gray-600">
            {product ? 'Modifier le produit' : 'Ajouter un produit'}
          </h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nom</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantité</label>
            <input
              type="number"
              name="quantity"
              value={form.quantity}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Prix d&apos;achat (FC)
            </label>
            <input
              type="number"
              name="purchasePrice"
              value={form.purchasePrice}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Prix de vente (FC)
            </label>
            <input
              type="number"
              name="salePrice"
              value={form.salePrice}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Prix minimum (FC)
            </label>
            <input
              type="number"
              name="minPrice"
              value={form.minPrice}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              URL image (thumbnail)
            </label>
            <input
              name="imageUrl"
              value={form.imageUrl}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-500"
            />
            {form.imageUrl && (
              <div className="mt-2 flex justify-center">
                <div className="relative h-20 w-20 overflow-hidden rounded-md border">
                  <Image
                    src={form.imageUrl}
                    alt="aperçu"
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
          <Button type="submit" className="w-full">
            {product ? 'Appliquer' : 'Ajouter'}
          </Button>
        </form>
      </div>
    </>
  );
});

// ---------- Page principale ----------
export default function OwnerInventoryPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [, startTransition] = useTransition();

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

  const handleDelete = useCallback(
    (id: string) => {
      startTransition(() => {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        const newFilteredLen = filteredProducts.length - 1;
        const newTotalPages = Math.ceil(newFilteredLen / ITEMS_PER_PAGE);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages);
        } else if (newFilteredLen === 0) {
          setCurrentPage(1);
        }
      });
    },
    [filteredProducts.length, currentPage, startTransition]
  );

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setIsSheetOpen(true);
  };

  const handleSaveProduct = useCallback(
    (savedProduct: Product) => {
      startTransition(() => {
        setProducts((prev) => {
          const existingIndex = prev.findIndex((p) => p.id === savedProduct.id);
          if (existingIndex !== -1) {
            const updated = [...prev];
            updated[existingIndex] = savedProduct;
            return updated;
          } else {
            return [...prev, savedProduct];
          }
        });
        setIsSheetOpen(false);
        setEditingProduct(null);
      });
    },
    [startTransition]
  );

  return (
    <section className="mx-auto w-full max-w-6xl">
      <Card className="border border-gray-100 bg-white/90 shadow-sm backdrop-blur-sm">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Inventaire</CardTitle>
            <p className="text-sm text-gray-600">
              Gestion des produits (recherche instantanée, pagination 10/page)
            </p>
          </div>
          <Button onClick={handleOpenCreate}>Ajouter un produit</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <SearchBar value={searchTerm} onChange={handleSearch} />

          {/* Version desktop - tableau */}
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
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-500">Stock : {product.quantity}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                    <span className="text-gray-900 font-bold">Achat :</span>
                    <span className="text-right font-medium text-gray-700">
                      {product.purchasePrice.toLocaleString()} FC
                    </span>
                    <span className="text-gray-900 font-bold">Vente :</span>
                    <span className="text-right font-medium text-gray-700">
                      {product.salePrice.toLocaleString()} FC
                    </span>
                    <span className="text-gray-900 font-bold">Minimum :</span>
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

      <ProductSheet
        key={editingProduct?.id || (isSheetOpen ? 'new' : 'closed')}
        isOpen={isSheetOpen}
        onClose={() => {
          setIsSheetOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        onSave={handleSaveProduct}
      />
    </section>
  );
}