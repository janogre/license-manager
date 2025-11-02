import { HardDrive, AlertTriangle, FileText, Key, DollarSign, TrendingUp, Loader2 } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useDashboard } from '@/hooks/useDashboard'

export default function DashboardPage() {
  const { t } = useTranslation()
  const { data, isLoading, error } = useDashboard()

  const stats = data?.stats || {
    totalAssets: 0,
    assetsWithoutContracts: 0,
    activeContracts: 0,
    expiringContracts: 0,
    totalLicenses: 0,
    totalAnnualCost: 0,
  }
  const assetsByStatus = data?.assetsByStatus || []
  const recentSyncs = data?.recentSyncs || []

  const statCards = [
    {
      name: t('dashboard.stats.totalAssets'),
      value: stats.totalAssets,
      icon: HardDrive,
      color: 'bg-primary-600',
      trend: { value: t('dashboard.stats.trend.thisMonth'), positive: true },
      to: '/assets',
    },
    {
      name: t('dashboard.stats.assetsWithoutContracts'),
      value: stats.assetsWithoutContracts,
      icon: AlertTriangle,
      color: 'bg-red-500',
      trend: { value: t('dashboard.stats.trend.needsAttention'), positive: false },
      to: '/assets?filter=noContracts',
    },
    {
      name: t('dashboard.stats.activeContracts'),
      value: stats.activeContracts,
      icon: FileText,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      to: '/contracts?status=active',
    },
    {
      name: t('dashboard.stats.expiringSoon'),
      value: stats.expiringContracts,
      icon: AlertTriangle,
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      to: '/contracts?filter=expiring',
    },
    {
      name: t('dashboard.stats.totalLicenses'),
      value: stats.totalLicenses,
      icon: Key,
      color: 'bg-gradient-to-br from-primary-500 to-primary-700',
      to: '/licenses',
    },
    {
      name: t('dashboard.stats.annualCost'),
      value: `${stats.totalAnnualCost.toLocaleString()} kr`,
      icon: DollarSign,
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      to: '/contracts',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {t('dashboard.lastUpdated')}: {format(new Date(), 'MMM d, yyyy HH:mm')}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">
            Error loading dashboard: {(error as any)?.response?.data?.error || 'Unknown error'}
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="ml-3 text-sm text-gray-500">Loading dashboard...</p>
        </div>
      )}

      {/* Stats Grid */}
      {!isLoading && (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {statCards.map((stat) => (
              <StatCard key={stat.name} {...stat} />
            ))}
          </div>

          {/* Pie Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Assets by Status - Pie Chart */}
            <Card>
              <CardHeader title={t('dashboard.assetsByStatus.title')} subtitle={t('dashboard.assetsByStatus.subtitle')} />
              <div className="flex flex-col items-center justify-center gap-6">
                {/* Pie Chart */}
                <div className="relative w-56 h-56">
                  <svg viewBox="0 0 200 200" className="transform -rotate-90">
                    {(() => {
                      const total = assetsByStatus.reduce((sum, i) => sum + i.count, 0)
                      let currentAngle = 0
                      const colors = {
                        ACTIVE: '#22c55e',
                        SPARE: '#3b82f6',
                        DEFECT: '#ef4444',
                        RETIRED: '#6b7280',
                      }

                      return assetsByStatus.map((item, index) => {
                        const percentage = item.count / total
                        const angle = percentage * 360
                        const largeArc = angle > 180 ? 1 : 0

                        const startX = 100 + 80 * Math.cos((currentAngle * Math.PI) / 180)
                        const startY = 100 + 80 * Math.sin((currentAngle * Math.PI) / 180)
                        const endX = 100 + 80 * Math.cos(((currentAngle + angle) * Math.PI) / 180)
                        const endY = 100 + 80 * Math.sin(((currentAngle + angle) * Math.PI) / 180)

                        const path = `M 100 100 L ${startX} ${startY} A 80 80 0 ${largeArc} 1 ${endX} ${endY} Z`

                        const slice = (
                          <path
                            key={item.status}
                            d={path}
                            fill={colors[item.status as keyof typeof colors] || '#6b7280'}
                            className="hover:opacity-80 transition-opacity cursor-pointer"
                          />
                        )

                        currentAngle += angle
                        return slice
                      })
                    })()}
                    <circle cx="100" cy="100" r="45" fill="white" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary-900">
                        {assetsByStatus.reduce((sum, i) => sum + i.count, 0)}
                      </div>
                      <div className="text-xs text-gray-600">{t('dashboard.assetsByStatus.assets')}</div>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-2 w-full">
                  {assetsByStatus.map((item) => {
                    const total = assetsByStatus.reduce((sum, i) => sum + i.count, 0)
                    const percentage = Math.round((item.count / total) * 100)
                    const colors = {
                      ACTIVE: 'bg-green-500',
                      SPARE: 'bg-blue-500',
                      DEFECT: 'bg-red-500',
                      RETIRED: 'bg-gray-500',
                    }

                    return (
                      <div key={item.status} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${colors[item.status as keyof typeof colors] || 'bg-gray-500'}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{t(`status.${item.status}`)}</span>
                            <span className="text-xs text-gray-500">({item.count})</span>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{percentage}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </Card>

            {/* Contract Coverage - Pie Chart */}
            <Card>
              <CardHeader title="Contract Coverage" subtitle="Maintenance contract status overview" />
              <div className="flex flex-col items-center justify-center gap-6">
                {/* Pie Chart */}
                <div className="relative w-56 h-56">
                  <svg viewBox="0 0 200 200" className="transform -rotate-90">
                    {(() => {
                      const contractData = [
                        { label: 'Active Coverage', count: stats.totalAssets - stats.assetsWithoutContracts - stats.expiringContracts, color: '#22c55e' },
                        { label: 'Expiring Soon', count: stats.expiringContracts, color: '#f59e0b' },
                        { label: 'No Coverage', count: stats.assetsWithoutContracts, color: '#ef4444' },
                      ]
                      const total = stats.totalAssets
                      let currentAngle = 0

                      return contractData.map((item) => {
                        const percentage = item.count / total
                        const angle = percentage * 360
                        const largeArc = angle > 180 ? 1 : 0

                        const startX = 100 + 80 * Math.cos((currentAngle * Math.PI) / 180)
                        const startY = 100 + 80 * Math.sin((currentAngle * Math.PI) / 180)
                        const endX = 100 + 80 * Math.cos(((currentAngle + angle) * Math.PI) / 180)
                        const endY = 100 + 80 * Math.sin(((currentAngle + angle) * Math.PI) / 180)

                        const path = `M 100 100 L ${startX} ${startY} A 80 80 0 ${largeArc} 1 ${endX} ${endY} Z`

                        const slice = (
                          <path
                            key={item.label}
                            d={path}
                            fill={item.color}
                            className="hover:opacity-80 transition-opacity cursor-pointer"
                          />
                        )

                        currentAngle += angle
                        return slice
                      })
                    })()}
                    <circle cx="100" cy="100" r="45" fill="white" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary-900">
                        {stats.totalAssets}
                      </div>
                      <div className="text-xs text-gray-600">Total Assets</div>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-2 w-full">
                  {[
                    { label: 'Active Coverage', count: stats.totalAssets - stats.assetsWithoutContracts - stats.expiringContracts, color: 'bg-green-500' },
                    { label: 'Expiring Soon', count: stats.expiringContracts, color: 'bg-amber-500' },
                    { label: 'No Coverage', count: stats.assetsWithoutContracts, color: 'bg-red-500' },
                  ].map((item) => {
                    const percentage = Math.round((item.count / stats.totalAssets) * 100)
                    return (
                      <div key={item.label} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{item.label}</span>
                            <span className="text-xs text-gray-500">({item.count})</span>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{percentage}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </Card>
          </div>

          {/* Alerts and Warnings */}
          <Card>
            <CardHeader title={t('dashboard.alerts.title')} subtitle={t('dashboard.alerts.subtitle')} />
            <div className="space-y-3">
              {stats.assetsWithoutContracts > 0 && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-red-900">
                      {stats.assetsWithoutContracts} {t('dashboard.alerts.assetsWithoutContracts')}
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      {t('dashboard.alerts.assetsWithoutContractsDesc')}
                    </p>
                  </div>
                </div>
              )}

              {stats.expiringContracts > 0 && (
                <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-orange-900">
                      {stats.expiringContracts} {t('dashboard.alerts.contractsExpiring')}
                    </div>
                    <p className="text-sm text-orange-700 mt-1">
                      {t('dashboard.alerts.contractsExpiringDesc')}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-green-900">{t('dashboard.alerts.systemHealth')}</div>
                  <p className="text-sm text-green-700 mt-1">
                    {stats.activeContracts} {t('dashboard.alerts.systemHealthDesc', { covered: stats.totalAssets - stats.assetsWithoutContracts })}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
