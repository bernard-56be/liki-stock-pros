import { CurrencyToggle } from '@/components/shared/currency-toggle';

export default function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Réglages</h1>
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Taux de change</h2>
        <CurrencyToggle />
      </div>
    </div>
  );
}