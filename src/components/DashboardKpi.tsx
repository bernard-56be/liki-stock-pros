// components/DashboardKpi.tsx
interface DashboardKpiProps {
  title: string
  value: string | number
  valueColor: string // ex: "text-green-600"
}

export default function DashboardKpi({ title, value, valueColor }: DashboardKpiProps) {
  return (
    <div className="bg-white rounded-lg p-4 shadow">
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <p className={`text-2xl font-bold ${valueColor}`}>
        {value}
      </p>
      <p className="text-xs text-gray-600">Aujourdhui</p>
    </div>
  )
}