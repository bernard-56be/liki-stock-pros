'use server'

import { createClient } from '@/lib/supabase/server'

export async function generateDailyReport(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non connecte')

  const { data: profile } = await supabase.from('profiles').select('boutique_id').eq('id', user.id).single()
  if (!profile?.boutique_id) throw new Error('Pas de boutique')

  const { data: boutique } = await supabase.from('boutiques').select('name, exchange_rate').eq('id', profile.boutique_id).single()
  const rate = Number(boutique?.exchange_rate) || 2850
  const shopName = boutique?.name || 'Boutique'

  const { data: revenue } = await supabase.from('vue_revenu_journalier').select('*').eq('boutique_id', profile.boutique_id).order('date', { ascending: false })
  const { data: topProducts } = await supabase.from('vue_top_produits_vendus').select('*').limit(5)
  const { data: sales } = await supabase.from('sales').select('total_amount, sale_currency')

  let total_usd = 0, total_cdf = 0
  sales?.forEach(s => { if (s.sale_currency === 'USD') total_usd += Number(s.total_amount); if (s.sale_currency === 'CDF') total_cdf += Number(s.total_amount) })

  const today = revenue?.[0] || { chiffre_affaires: 0, benefice_net: 0 }

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport de Caisse - ${new Date().toLocaleDateString('fr-FR')}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', Arial, sans-serif; padding: 40px; color: #1E293B; }
    .header { background: #1E56D3; color: white; padding: 24px; border-radius: 12px; margin-bottom: 32px; }
    .header h1 { font-size: 22px; font-weight: 700; }
    .header p { font-size: 13px; opacity: 0.9; margin-top: 4px; }
    .section { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 20px; margin-bottom: 16px; }
    .section h2 { font-size: 16px; font-weight: 600; color: #1E293B; margin-bottom: 12px; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; border-bottom: 1px solid #E2E8F0; }
    .row:last-child { border-bottom: none; }
    .label { color: #64748B; }
    .value { font-weight: 600; color: #1E293B; }
    .green { color: #10B981; }
    .blue { color: #3B82F6; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th { background: #E2E8F0; padding: 10px; text-align: left; font-size: 13px; font-weight: 600; color: #475569; }
    td { padding: 10px; font-size: 14px; border-bottom: 1px solid #E2E8F0; }
    .bar-chart { margin-top: 16px; }
    .bar-row { display: flex; align-items: center; margin-bottom: 8px; }
    .bar-label { width: 120px; font-size: 12px; font-weight: 500; color: #475569; }
    .bar-track { flex: 1; height: 20px; background: #E2E8F0; border-radius: 10px; overflow: hidden; }
    .bar-fill { height: 100%; background: #3B82F6; border-radius: 10px; }
    .bar-value { width: 50px; text-align: right; font-size: 12px; font-weight: 600; color: #1E293B; margin-left: 8px; }
    .footer { text-align: center; font-size: 11px; color: #94A3B8; margin-top: 32px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Rapport de Cloture de Caisse</h1>
    <p>${shopName} - ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>

  <div class="section">
    <h2>Chiffre d'Affaires Global</h2>
    <div class="row"><span class="label">Dollars (USD)</span><span class="value green">$${today.chiffre_affaires.toFixed(2)}</span></div>
    <div class="row"><span class="label">Francs Congolais (CDF)</span><span class="value blue">${(today.chiffre_affaires * rate).toLocaleString('fr-FR')} FC</span></div>
  </div>

  <div class="section">
    <h2>Benefice Net</h2>
    <div class="row"><span class="label">Dollars (USD)</span><span class="value green">$${today.benefice_net.toFixed(2)}</span></div>
    <div class="row"><span class="label">Francs Congolais (CDF)</span><span class="value blue">${(today.benefice_net * rate).toLocaleString('fr-FR')} FC</span></div>
  </div>

  <div class="section">
    <h2>Totaux par Devise</h2>
    <div class="row"><span class="label">Perçu en USD</span><span class="value">$${total_usd.toLocaleString('fr-FR')}</span></div>
    <div class="row"><span class="label">Perçu en CDF</span><span class="value">${total_cdf.toLocaleString('fr-FR')} FC</span></div>
  </div>

  <div class="section">
    <h2>Top 5 Produits Vendus</h2>
    <table>
      <thead><tr><th>Produit</th><th>Quantite vendue</th></tr></thead>
      <tbody>
        ${topProducts?.map(p => `<tr><td>${p.product_name}</td><td>${p.total_vendus}</td></tr>`).join('') || '<tr><td colspan="2">Aucune donnee</td></tr>'}
      </tbody>
    </table>
    ${topProducts && topProducts.length > 0 ? `
    <div class="bar-chart">
      ${topProducts.map(p => {
        const maxV = Math.max(...topProducts.map(x => x.total_vendus), 1)
        const pct = (p.total_vendus / maxV) * 100
        return `<div class="bar-row">
          <span class="bar-label">${p.product_name}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
          <span class="bar-value">${p.total_vendus}</span>
        </div>`
      }).join('')}
    </div>` : ''}
  </div>

  <div class="footer">Genere par Liki-Stock Pro</div>
</body>
</html>`

  return html
}