'use client'

import { useEffect, useState } from 'react'
import { fetchDashboardData, type DashboardData } from '@/lib/actions/dashboardService'
import DashboardKpi from '@/components/DashboardKpi'
import SalesChart from '@/components/SalesChart'

export default function OwnerDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const result = await fetchDashboardData()
        setData(result)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue'
        setError(message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <p className="text-gray-600">Chargement du tableau de bord...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg font-bold">
          Erreur : {error}
        </div>
      </div>
    )
  }

  if (!data) return null

  const today = data.dailyRevenue[0] || { chiffre_affaires: 0, benefice_net: 0 }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DashboardKpi
          title="💰 Chiffre d'Affaires"
          value={`$${today.chiffre_affaires.toLocaleString()}`}
          valueColor="text-green-600"
        />
        <DashboardKpi
          title="📈 Bénéfice Net"
          value={`$${today.benefice_net.toLocaleString()}`}
          valueColor="text-blue-600"
        />
        <DashboardKpi
          title="🚨 Alerte Rupture"
          value={data.outOfStockCount}
          valueColor="text-red-600"
        />
      </div>

      <SalesChart topProducts={data.topProducts} />
    </div>
  )
}