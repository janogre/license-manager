import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import { HardDrive, AlertTriangle, FileText, Key, DollarSign } from 'lucide-react'

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats')
      return response.data
    },
  })

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>
  }

  const stats = data?.stats || {}
  const assetsByStatus = data?.assetsByStatus || []
  const recentSyncs = data?.recentSyncs || []

  const statCards = [
    {
      name: 'Total Assets',
      value: stats.totalAssets || 0,
      icon: HardDrive,
      color: 'bg-blue-500',
    },
    {
      name: 'Assets Without Contracts',
      value: stats.assetsWithoutContracts || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
    {
      name: 'Active Contracts',
      value: stats.activeContracts || 0,
      icon: FileText,
      color: 'bg-green-500',
    },
    {
      name: 'Expiring Soon',
      value: stats.expiringContracts || 0,
      icon: AlertTriangle,
      color: 'bg-orange-500',
    },
    {
      name: 'Total Licenses',
      value: stats.totalLicenses || 0,
      icon: Key,
      color: 'bg-purple-500',
    },
    {
      name: 'Annual Cost',
      value: `$${(stats.totalAnnualCost || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-indigo-500',
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 ${stat.color} rounded-md p-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                      <dd className="text-2xl font-semibold text-gray-900">{stat.value}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Assets by Status */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Assets by Status</h2>
          <div className="space-y-3">
            {assetsByStatus.map((item: any) => (
              <div key={item.status} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.status}</span>
                <span className="text-sm font-semibold text-gray-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Sync Activity */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Sync Activity</h2>
          <div className="space-y-3">
            {recentSyncs.length > 0 ? (
              recentSyncs.map((sync: any) => (
                <div key={sync.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium text-gray-900">
                      {sync.asset?.hostname || sync.asset?.serialNumber || 'Unknown'}
                    </div>
                    <div className="text-gray-500">{sync.syncType}</div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs ${
                    sync.syncStatus === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {sync.syncStatus}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No recent sync activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
