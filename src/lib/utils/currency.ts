export function convertAmount(
  amount: number,
  rate: number,
  from: 'USD' | 'CDF',
  to: 'USD' | 'CDF'
): number {
  // Si même devise, retourner le montant sans modification, mais appliquer l'arrondi correct pour normaliser.
  if (from === to) {
    // Appliquer arrondi selon devise de sortie pour normaliser
    return to === 'USD' ? roundToTwoDecimals(amount) : Math.round(amount);
  }

  // Conversion USD -> CDF
  if (from === 'USD' && to === 'CDF') {
    // Multiplier par le taux, puis arrondir à l'entier le plus proche
    // On utilise Math.round sur le résultat brut pour éviter les erreurs de virgule flottante.
    const raw = amount * rate;
    return Math.round(raw);
  }

  // Conversion CDF -> USD
  if (from === 'CDF' && to === 'USD') {
    // Diviser par le taux, puis arrondir à 2 décimales.
    const raw = amount / rate;
    return roundToTwoDecimals(raw);
  }

  // Ne devrait jamais arriver grâce aux conditions, mais par sécurité :
  throw new Error('Devises non prises en charge');
}

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatCurrency(amount: number, currency: 'USD' | 'CDF'): string {
  if (currency === 'CDF') {
    // Arrondir à l'entier, puis formater avec séparateur d'espaces.
    const rounded = Math.round(amount);
    const formattedNumber = rounded.toLocaleString('fr-FR', {
      maximumFractionDigits: 0,
      useGrouping: true,
    });
    return `${formattedNumber} FC`;
  } else {
    // USD : deux décimales, séparateur de milliers, virgule pour décimale
    const rounded = roundToTwoDecimals(amount);
    const formattedNumber = rounded.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    });
    return `${formattedNumber} $`;
  }
}