'use server'

import { createClient } from '@/lib/supabase/server'

// ---- Types ----
export interface DailyReportData {
  date: string
  chiffre_affaires: number
  benefice_net: number
  total_usd: number
  total_cdf: number
  exchange_rate: number
  par_employe: {
    nom: string
    produits_vendus: number
    ca_cdf: number
    ca_usd: number
    remises: number
  }[]
}

// ---- Récupération des données du rapport ----
export async function getDailyReportData(dateStr?: string): Promise<DailyReportData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non connecté')

  // Récupérer la boutique du propriétaire connecté
  const { data: profile } = await supabase
    .from('profiles')
    .select('boutique_id')
    .eq('id', user.id)
    .single()
  if (!profile?.boutique_id) throw new Error('Pas de boutique')

  const { data: boutique } = await supabase
    .from('boutiques')
    .select('exchange_rate')
    .eq('id', profile.boutique_id)
    .single()
  const rate = Number(boutique?.exchange_rate) || 2850

  // Date cible (par défaut aujourd'hui)
  const targetDate = dateStr || new Date().toISOString().split('T')[0]

  // CA et bénéfice du jour (vue d'Enock)
  const { data: revenu } = await supabase
    .from('vue_revenu_journalier')
    .select('*')
    .eq('boutique_id', profile.boutique_id)
    .eq('date', targetDate)
    .single()

  const chiffre_affaires = revenu?.chiffre_affaires || 0
  const benefice_net = revenu?.benefice_net || 0

  // Totaux par devise sur ce jour (toutes les ventes de la boutique)
  const { data: sales } = await supabase
    .from('sales')
    .select('total_amount, sale_currency, seller_id')
    .gte('created_at', `${targetDate}T00:00:00`)
    .lte('created_at', `${targetDate}T23:59:59`)

  let total_usd = 0
  let total_cdf = 0
  sales?.forEach(s => {
    if (s.sale_currency === 'USD') total_usd += Number(s.total_amount)
    if (s.sale_currency === 'CDF') total_cdf += Number(s.total_amount)
  })

  // Détail par employé
  const { data: employees } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('boutique_id', profile.boutique_id)

  const par_employe = []
  if (employees) {
    for (const emp of employees) {
      const { data: empSales } = await supabase
        .from('sales')
        .select('id, total_amount, sale_currency')
        .eq('seller_id', emp.id)
        .gte('created_at', `${targetDate}T00:00:00`)
        .lte('created_at', `${targetDate}T23:59:59`)

      let produits_vendus = 0
      let ca_cdf = 0
      let ca_usd = 0
      let remises = 0

      if (empSales) {
        for (const sale of empSales) {
          const { data: items } = await supabase
            .from('sale_items')
            .select('quantity, unit_price, product_id')
            .eq('sale_id', sale.id)

          if (items) {
            for (const item of items) {
              produits_vendus += item.quantity
              if (sale.sale_currency === 'CDF') {
                ca_cdf += item.quantity * item.unit_price
              } else {
                ca_usd += item.quantity * item.unit_price
              }

              // Vérifier si c'est une remise (prix de vente < prix catalogue)
              const { data: product } = await supabase
                .from('products')
                .select('sale_price')
                .eq('id', item.product_id)
                .single()
              if (product && item.unit_price < product.sale_price) {
                remises++
              }
            }
          }
        }
      }

      par_employe.push({
        nom: emp.full_name || 'Inconnu',
        produits_vendus,
        ca_cdf,
        ca_usd,
        remises,
      })
    }
  }

  return {
    date: targetDate,
    chiffre_affaires,
    benefice_net,
    total_usd,
    total_cdf,
    exchange_rate: rate,
    par_employe,
  }
  
}

export interface ActionResponse {
  success: boolean;
  message?: string;
  error?: string;
  limitReached?: boolean; // Ajoutez cette ligne
  currentCount?: number;  // Ajoutez cette ligne
  maxAllowed?: number;    // Ajoutez cette ligne
  subscription?: string;  // Ajoutez cette ligne
}

// ---- Génération du rapport HTML ----
export async function generateDailyReportHtml(dateStr?: string): Promise<string> {
  const data = await getDailyReportData(dateStr)

  const rowsEmployes = data.par_employe.map((e, i) => `
    <tr class="${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">
      <td class="py-3 px-4 font-medium text-gray-800">${e.nom}</td>
      <td class="py-3 px-4 text-center">${e.produits_vendus}</td>
      <td class="py-3 px-4 text-right">${e.ca_cdf.toLocaleString('fr-FR')} FC<br><span class="text-xs text-gray-500">$${e.ca_usd.toFixed(2)}</span></td>
      <td class="py-3 px-4 text-center">${e.remises > 0 ? `<span class="text-red-600 font-semibold">${e.remises}</span>` : '0'}</td>
    </tr>
  `).join('')

  const totalProduits = data.par_employe.reduce((sum, e) => sum + e.produits_vendus, 0)
  const totalRemises = data.par_employe.reduce((sum, e) => sum + e.remises, 0)

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport de Clôture - ${data.date}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%);
      padding: 30px;
      color: #1E293B;
      min-height: 100vh;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%);
      padding: 35px 40px;
      color: white;
    }

    .header h1 {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }

    .header .date {
      font-size: 14px;
      opacity: 0.85;
      margin-top: 8px;
      font-weight: 400;
    }

    .content {
      padding: 30px 40px;
    }

    .section {
      margin-bottom: 30px;
    }

    .section h2 {
      font-size: 18px;
      font-weight: 700;
      color: #1E293B;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #E2E8F0;
    }

    .kpi-grid {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
      margin-bottom: 25px;
    }

    .kpi-card {
      flex: 1;
      min-width: 200px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 18px;
      text-align: center;
    }

    .kpi-card .label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 8px;
    }

    .kpi-card .value {
      font-size: 22px;
      font-weight: 800;
      color: #1E293B;
    }

    .kpi-card .sub {
      font-size: 13px;
      color: #64748b;
      margin-top: 4px;
    }

    .kpi-card.green {
      border-left: 4px solid #10B981;
    }

    .kpi-card.blue {
      border-left: 4px solid #3B82F6;
    }

    .kpi-card.purple {
      border-left: 4px solid #8B5CF6;
    }

    .kpi-card.amber {
      border-left: 4px solid #F59E0B;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    th {
      background: #1E293B;
      color: white;
      padding: 12px 16px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-align: left;
    }

    td {
      padding: 14px 16px;
      font-size: 14px;
      border-bottom: 1px solid #f1f5f9;
    }

    tr:last-child td {
      border-bottom: none;
    }

    .footer {
      background: #f8fafc;
      padding: 20px 40px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      font-weight: 500;
    }

    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .badge-success {
      background: #d1fae5;
      color: #065f46;
    }

    .badge-warning {
      background: #fef3c7;
      color: #92400e;
    }

    .summary-row {
      background: #f0f9ff;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Rapport de Clôture de Caisse</h1>
      <p class="date">${new Date(data.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>

    <div class="content">
      <div class="kpi-grid">
        <div class="kpi-card green">
          <div class="label">💰 Chiffre d'Affaires</div>
          <div class="value">$${data.chiffre_affaires.toFixed(2)}</div>
          <div class="sub">${(data.chiffre_affaires * data.exchange_rate).toLocaleString('fr-FR')} FC</div>
        </div>
        <div class="kpi-card blue">
          <div class="label">📈 Bénéfice Net</div>
          <div class="value">$${data.benefice_net.toFixed(2)}</div>
          <div class="sub">${(data.benefice_net * data.exchange_rate).toLocaleString('fr-FR')} FC</div>
        </div>
        <div class="kpi-card purple">
          <div class="label">💵 Perçu en USD</div>
          <div class="value">$${data.total_usd.toLocaleString()}</div>
        </div>
        <div class="kpi-card amber">
          <div class="label">💵 Perçu en CDF</div>
          <div class="value">${data.total_cdf.toLocaleString()} FC</div>
        </div>
      </div>

      <div class="section">
        <h2>👥 Détail par Employé</h2>
        <table>
          <thead>
            <tr>
              <th>Employé</th>
              <th style="text-align:center">Produits vendus</th>
              <th style="text-align:right">CA généré</th>
              <th style="text-align:center">Remises</th>
            </tr>
          </thead>
          <tbody>
            ${rowsEmployes || '<tr><td colspan="4" style="text-align:center;padding:20px;color:#94a3b8;">Aucune donnée pour cette date</td></tr>'}
            <tr class="summary-row">
              <td class="py-3 px-4 font-bold">TOTAL</td>
              <td class="py-3 px-4 text-center font-bold">${totalProduits}</td>
              <td class="py-3 px-4 text-right font-bold">${data.chiffre_affaires.toFixed(2)} $ / ${(data.chiffre_affaires * data.exchange_rate).toLocaleString('fr-FR')} FC</td>
              <td class="py-3 px-4 text-center font-bold">${totalRemises}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="footer">
      Généré par Liki-Stock Pro • ${new Date().toLocaleString('fr-FR')}
    </div>
  </div>
</body>
</html>`
}