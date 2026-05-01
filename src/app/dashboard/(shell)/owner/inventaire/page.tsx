import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  salePrice: number;
  minPrice: number;
};

const mockInventory: InventoryItem[] = [
  {
    id: 'P-001',
    name: 'Riz Premium 25kg',
    quantity: 18,
    purchasePrice: 58000,
    salePrice: 65000,
    minPrice: 61000,
  },
  {
    id: 'P-002',
    name: 'Huile végétale 5L',
    quantity: 7,
    purchasePrice: 9200,
    salePrice: 11000,
    minPrice: 10000,
  },
  {
    id: 'P-003',
    name: 'Sucre blanc 1kg',
    quantity: 42,
    purchasePrice: 1350,
    salePrice: 1700,
    minPrice: 1550,
  },
  {
    id: 'P-004',
    name: 'Savon lessive (lot x12)',
    quantity: 4,
    purchasePrice: 7600,
    salePrice: 9300,
    minPrice: 8600,
  },
];

function formatFc(value: number) {
  return `${value.toLocaleString('fr-FR')} FC`;
}

function InventoryTable({ items }: { items: InventoryItem[] }) {
  return (
    <div className="space-y-4">
      <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-700">
            <tr>
              <th className="px-4 py-3 font-semibold">Produit</th>
              <th className="px-4 py-3 font-semibold">Quantité</th>
              <th className="px-4 py-3 font-semibold">Prix d&apos;achat</th>
              <th className="px-4 py-3 font-semibold">Prix de vente</th>
              <th className="px-4 py-3 font-semibold">Prix minimum</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                <td className="px-4 py-3 text-gray-700">{item.quantity}</td>
                <td className="px-4 py-3 text-gray-700">{formatFc(item.purchasePrice)}</td>
                <td className="px-4 py-3 text-gray-700">{formatFc(item.salePrice)}</td>
                <td className="px-4 py-3 text-gray-700">{formatFc(item.minPrice)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button variant="outline" type="button" className="text-xs">
                      Modifier
                    </Button>
                    <Button variant="danger" type="button" className="text-xs">
                      Supprimer
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {items.map((item) => (
          <Card key={item.id} className="border border-gray-200 shadow-sm" padding="sm">
            <CardContent className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                  Stock: {item.quantity}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm text-gray-700">
                <span>Achat</span>
                <span className="text-right font-medium">{formatFc(item.purchasePrice)}</span>
                <span>Vente</span>
                <span className="text-right font-medium">{formatFc(item.salePrice)}</span>
                <span>Minimum</span>
                <span className="text-right font-medium">{formatFc(item.minPrice)}</span>
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" type="button" fullWidth className="text-xs">
                  Modifier
                </Button>
                <Button variant="danger" type="button" fullWidth className="text-xs">
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function OwnerInventoryPage() {
  return (
    <section className="mx-auto w-full max-w-6xl">
      <Card className="border border-gray-100 bg-white/90 shadow-sm backdrop-blur-sm">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Inventaire</CardTitle>
            <p className="text-sm text-gray-600">
              Aperçu des produits avec structure optimisée pour la pagination.
            </p>
          </div>
          <Link
            href="/dashboard/owner/inventaire/ajouter"
            className="inline-flex w-full items-center justify-center rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-center text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 md:w-auto"
          >
            Ajouter un produit
          </Link>
        </CardHeader>

        <CardContent className="space-y-4">
          <InventoryTable items={mockInventory} />

          <nav className="flex items-center justify-between border-t border-gray-100 pt-3">
            <Button variant="outline" type="button" disabled>
              Précédent
            </Button>
            <p className="text-sm text-gray-600">Page 1 sur 1</p>
            <Button variant="outline" type="button" disabled>
              Suivant
            </Button>
          </nav>
        </CardContent>
      </Card>
    </section>
  );
}
