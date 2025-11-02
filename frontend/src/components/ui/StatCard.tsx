import { LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'
import { Link } from 'react-router-dom'

interface StatCardProps {
  name: string
  value: string | number
  icon: LucideIcon
  color: string
  trend?: {
    value: string
    positive: boolean
  }
  to?: string
}

export function StatCard({ name, value, icon: Icon, color, trend, to }: StatCardProps) {
  const content = (
    <div className="p-6">
      <div className="flex items-center">
        <div className={clsx('flex-shrink-0 rounded-xl p-4 shadow-md', color)}>
          <Icon className="h-7 w-7 text-white" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-600 truncate mb-1">{name}</dt>
            <dd className="flex items-baseline">
              <div className="text-3xl font-bold text-primary-900">{value}</div>
              {trend && (
                <div
                  className={clsx(
                    'ml-2 flex items-baseline text-sm font-semibold',
                    trend.positive ? 'text-neas-moss' : 'text-red-600'
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
  )

  if (to) {
    return (
      <Link
        to={to}
        className="block bg-gradient-to-br from-white to-gray-50 overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
      >
        {content}
      </Link>
    )
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow duration-300">
      {content}
    </div>
  )
}
