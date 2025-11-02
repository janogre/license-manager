import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import type { AssetStatus } from '@/types'

export interface DashboardStats {
  totalAssets: number
  assetsWithoutContracts: number
  activeContracts: number
  expiringContracts: number
  totalLicenses: number
  totalAnnualCost: number
}

export interface AssetsByStatus {
  status: AssetStatus
  count: number
}

export interface RecentSync {
  id: string
  assetId: string
  syncType: string
  syncStatus: string
  syncedAt: string
  asset: {
    hostname?: string
    serialNumber: string
  } | null
}

export interface DashboardData {
  stats: DashboardStats
  assetsByStatus: AssetsByStatus[]
  recentSyncs: RecentSync[]
}

// Fetch all dashboard data
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<DashboardData>('/dashboard/stats')
      return data
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })
}
