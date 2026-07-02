'use server'

import { createClient } from '@/lib/supabase/server'
import jsPDF from 'jspdf'

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

export interface ActionResponse {
  success: boolean;
  message?: string;
  error?: string;
  limitReached?: boolean;
  currentCount?: number;
  maxAllowed?: number;
  subscription?: string;
}

// ---- Récupération des données du rapport ----
export async function getDailyReportData(dateStr?: string): Promise<DailyReportData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non connecté')

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

  const targetDate = dateStr || new Date().toISOString().split('T')[0]

  const { data: revenu } = await supabase
    .from('vue_revenu_journalier')
    .select('*')
    .eq('boutique_id', profile.boutique_id)
    .eq('date', targetDate)
    .single()

  const chiffre_affaires = revenu?.chiffre_affaires || 0
  const benefice_net = revenu?.benefice_net || 0

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

// ---- Génération du rapport PDF ----
export async function generateDailyReportPdf(dateStr?: string): Promise<string> {
  const data = await getDailyReportData(dateStr)
  const rate = data.exchange_rate

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 15

  // ---- En-tête ----
  doc.setFillColor(30, 64, 175)
  doc.rect(0, 0, pageWidth, 30, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Rapport de Cloture de Caisse', pageWidth / 2, 18, { align: 'center' })
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const dateFormatted = new Date(data.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  doc.text(dateFormatted, pageWidth / 2, 25, { align: 'center' })

  y = 38

  // ---- KPI Cards (2x2) ----
  const cardWidth = (pageWidth - 30) / 2
  const cardHeight = 28
  const cards = [
    { label: 'Chiffre d\'Affaires', value: `$${data.chiffre_affaires.toFixed(2)}`, sub: `${(data.chiffre_affaires * rate).toLocaleString('fr-FR')} FC`, color: '#10B981' },
    { label: 'Benefice Net', value: `$${data.benefice_net.toFixed(2)}`, sub: `${(data.benefice_net * rate).toLocaleString('fr-FR')} FC`, color: '#3B82F6' },
    { label: 'Percu en USD', value: `$${data.total_usd.toLocaleString()}`, sub: '', color: '#8B5CF6' },
    { label: 'Percu en CDF', value: `${data.total_cdf.toLocaleString()} FC`, sub: '', color: '#F59E0B' },
  ]

  cards.forEach((card, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = 10 + col * (cardWidth + 10)
    const cy = y + row * (cardHeight + 8)

    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(card.color)
    doc.setLineWidth(0.8)
    doc.roundedRect(x, cy, cardWidth, cardHeight, 3, 3)
    doc.setLineWidth(1.5)
    doc.line(x, cy + 2, x, cy + cardHeight - 2)

    doc.setFontSize(7)
    doc.setTextColor(100, 116, 139)
    doc.setFont('helvetica', 'bold')
    doc.text(card.label.toUpperCase(), x + 6, cy + 8)

    doc.setFontSize(14)
    doc.setTextColor(30, 41, 59)
    doc.setFont('helvetica', 'bold')
    doc.text(card.value, x + 6, cy + 18)

    if (card.sub) {
      doc.setFontSize(8)
      doc.setTextColor(100, 116, 139)
      doc.setFont('helvetica', 'normal')
      doc.text(card.sub, x + 6, cy + 23)
    }
  })

  y += 2 * cardHeight + 24

  // ---- Section Détail par Employé ----
  doc.setFontSize(14)
  doc.setTextColor(30, 41, 59)
  doc.setFont('helvetica', 'bold')
  doc.text('Detail par Employe', 10, y)
  y += 8

  const headers = ['Employe', 'Produits', 'CA Genere', 'Remises']
  const colWidths = [60, 25, 60, 35]
  const tableStartX = 10

  doc.setFillColor(30, 41, 59)
  doc.rect(tableStartX, y, pageWidth - 20, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  let headerX = tableStartX + 3
  headers.forEach((header, i) => {
    doc.text(header, headerX, y + 7)
    headerX += colWidths[i]
  })

  y += 11

  doc.setFont('helvetica', 'normal')
  let totalProduits = 0, totalRemises = 0

  data.par_employe.forEach((emp, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252)
      doc.rect(tableStartX, y, pageWidth - 20, 8, 'F')
    }
    doc.setTextColor(30, 41, 59)
    doc.setFontSize(8)
    let rowX = tableStartX + 3

    doc.text(emp.nom.substring(0, 25), rowX, y + 5.5)
    rowX += colWidths[0]
    doc.text(emp.produits_vendus.toString(), rowX, y + 5.5)
    rowX += colWidths[1]
    const caText = `${emp.ca_cdf.toLocaleString('fr-FR')} FC / $${emp.ca_usd.toFixed(2)}`
    doc.text(caText.substring(0, 28), rowX, y + 5.5)
    rowX += colWidths[2]
    doc.text(emp.remises.toString(), rowX, y + 5.5)

    totalProduits += emp.produits_vendus
    totalRemises += emp.remises
    y += 8
  })

  // Ligne total
  doc.setFillColor(240, 249, 255)
  doc.rect(tableStartX, y, pageWidth - 20, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('TOTAL', tableStartX + 3, y + 5.5)
  doc.text(totalProduits.toString(), tableStartX + 3 + colWidths[0], y + 5.5)
  doc.text(`${data.chiffre_affaires.toFixed(2)} $ / ${(data.chiffre_affaires * rate).toLocaleString('fr-FR')} FC`.substring(0, 28), tableStartX + 3 + colWidths[0] + colWidths[1], y + 5.5)
  doc.text(totalRemises.toString(), tableStartX + 3 + colWidths[0] + colWidths[1] + colWidths[2], y + 5.5)

  // Pied de page
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.setFont('helvetica', 'normal')
  doc.text(`Genere par Liki-Stock Pro - ${new Date().toLocaleString('fr-FR')}`, pageWidth / 2, 290, { align: 'center' })

  return doc.output('datauristring')
}