import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function EmployeeSalesPage() {
  return (
    <section className="mx-auto w-full max-w-3xl">
      <Card className="border border-gray-100 bg-white/90 shadow-sm backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Espace Ventes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">Contenu à venir.</p>
        </CardContent>
      </Card>
    </section>
  );
}
