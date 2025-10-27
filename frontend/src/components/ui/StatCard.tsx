import { LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'

interface StatCardProps {
  name: string
  value: string | number
  icon: LucideIcon
  color: string
  trend?: {
    value: string
    positive: boolean
  }
}

export function StatCard({ name, value, icon: Icon, color, trend }: StatCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={clsx('flex-shrink-0 rounded-md p-3', color)}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{name}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                {trend && (
                  <div
                    className={clsx(
                      'ml-2 flex items-baseline text-sm font-semibold',
                      trend.positive ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {trend.value}
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
