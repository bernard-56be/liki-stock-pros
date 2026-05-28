import { ExchangeRateProvider } from '@/contexts/exchangeRateContext';
import { CurrencyDisplayProvider } from '@/contexts/currencyDisplayContext';
import { CurrencySelector } from '@/components/shared/currencySelector';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ExchangeRateProvider>
      <CurrencyDisplayProvider>
        <div className="min-h-screen bg-gray-50">
          <header className="flex justify-between items-center p-4 bg-white shadow">
            <h1 className="text-xl font-bold">Liki-Stock Pro</h1>
            <CurrencySelector />
          </header>
          <main>{children}</main>
        </div>
      </CurrencyDisplayProvider>
    </ExchangeRateProvider>
  );
}