/**
 * Convertit un montant USD en CDF selon le taux donné
 */
export function convertUsdToCdf(usd: number, rate: number): number {
  return usd * rate;
}

/**
 * Convertit un montant CDF en USD selon le taux donné
 */
export function convertCdfToUsd(cdf: number, rate: number): number {
  if (rate === 0) return 0;
  return cdf / rate;
}

/**
 * Formate un nombre en devise (USD ou CDF)
 */
export function formatCurrency(amount: number, currency: 'USD' | 'CDF'): string {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  } else {
    return new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF' }).format(amount);
  }
}