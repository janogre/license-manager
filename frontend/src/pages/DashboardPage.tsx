import { HardDrive, AlertTriangle, FileText, Key, DollarSign, TrendingUp } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { mockDashboardStats, mockAssetsByStatus, mockRecentSyncs } from '@/utils/mockData'
import { format } from 'date-fns'

export default function DashboardPage() {
  const stats = mockDashboardStats
  const assetsByStatus = mockAssetsByStatus
  const recentSyncs = mockRecentSyncs

  const statCards = [
    {
      name: 'Total Assets',
      value: stats.totalAssets,
      icon: HardDrive,
      color: 'bg-blue-500',
      trend: { value: '+2 this month', positive: true },
    },
    {
      name: 'Assets Without Contracts',
      value: stats.assetsWithoutContracts,
      icon: AlertTriangle,
      color: 'bg-red-500',
      trend: { value: 'Needs attention', positive: false },
    },
    {
      name: 'Active Contracts',
      value: stats.activeContracts,
      icon: FileText,
      color: 'bg-green-500',
    },
    {
      name: 'Expiring Soon (90 days)',
      value: stats.expiringContracts,
      icon: AlertTriangle,
      color: 'bg-orange-500',
    },
    {
      name: 'Total Licenses',
      value: stats.totalLicenses,
      icon: Key,
      color: 'bg-purple-500',
    },
    {
      name: 'Annual Cost',
      value: `$${stats.totalAnnualCost.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-indigo-500',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Overview of your Juniper asset and license portfolio
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {format(new Date(), 'MMM d, yyyy HH:mm')}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <StatCard key={stat.name} {...stat} />
        ))}
      </div>

      {/* Charts and Details */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Assets by Status */}
        <Card>
          <CardHeader title="Assets by Status" subtitle="Current distribution" />
          <div className="space-y-4">
            {assetsByStatus.map((item) => {
              const total = assetsByStatus.reduce((sum, i) => sum + i.count, 0)
              const percentage = Math.round((item.count / total) * 100)

              return (
                <div key={item.status}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          item.status === 'ACTIVE'
                            ? 'success'
                            : item.status === 'SPARE'
                            ? 'info'
                            : item.status === 'DEFECT'
                            ? 'danger'
                            : 'default'
                        }
                      >
                        {item.status}
                      </Badge>
                      <span className="text-sm text-gray-600">{item.count} assets</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Recent Sync Activity */}
        <Card>
          <CardHeader
            title="Recent Sync Activity"
            subtitle="Latest Observium synchronizations"
          />
          <div className="space-y-3">
            {recentSyncs.length > 0 ? (
              recentSyncs.map((sync) => (
                <div
                  key={sync.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {sync.asset?.hostname || sync.asset?.serialNumber || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {sync.syncType} • {format(new Date(sync.syncedAt), 'MMM d, HH:mm')}
                    </div>
                  </div>
                  <Badge variant={sync.syncStatus === 'success' ? 'success' : 'danger'}>
                    {sync.syncStatus}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No recent sync activity
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Alerts and Warnings */}
      <Card>
        <CardHeader title="Important Alerts" subtitle="Items requiring attention" />
        <div className="space-y-3">
          {stats.assetsWithoutContracts > 0 && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-red-900">
                  {stats.assetsWithoutContracts} assets without maintenance contracts
                </div>
                <p className="text-sm text-red-700 mt-1">
                  These assets are not covered by support. Consider adding them to a contract.
                </p>
              </div>
            </div>
          )}

          {stats.expiringContracts > 0 && (
            <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-orange-900">
                  {stats.expiringContracts} contracts expiring in the next 90 days
                </div>
                <p className="text-sm text-orange-700 mt-1">
                  Review and renew these contracts to maintain support coverage.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-green-900">System Health: Good</div>
              <p className="text-sm text-green-700 mt-1">
                {stats.activeContracts} active contracts covering {stats.totalAssets - stats.assetsWithoutContracts} assets.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
