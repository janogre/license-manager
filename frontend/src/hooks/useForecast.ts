import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'

// Types for forecast data
export interface ForecastPeriod {
  period: string
  periodStart: string
  periodEnd: string
  billingGroupCosts: {
    groupId: string
    groupName: string
    totalCost: number
    assetCount: number
  }[]
  contractRenewals: {
    contractId: string
    contractNumber: string
    vendor: string
    renewalCost: number
    renewalDate: string
  }[]
  totalBillingCosts: number
  totalRenewalCosts: number
  totalPeriodCost: number
}

export interface ForecastSummary {
  totalForecast: number
  averageMonthly: number
  peakMonth: {
    period: string
    amount: number
  }
  nextRenewals: {
    contractId: string
    contractNumber: string
    renewalDate: string
    cost: number
  }[]
  upcomingBillingPeriods: {
    groupId: string
    groupName: string
    nextBillingDate: string
    estimatedCost: number
  }[]
}

export interface ForecastResponse {
  forecast: {
    periods: ForecastPeriod[]
    summary: ForecastSummary
    metadata: {
      forecastStart: string
      forecastEnd: string
      totalPeriods: number
      generatedAt: string
    }
  }
}

export interface BillingGroupBreakdown {
  id: string
  name: string
  billingType: string
  periodStart: string
  periodEnd: string
  assetCount: number
  totalAssetValue: number
  periodCost: number
  estimatedAnnualCost: number
}

export interface UpcomingRenewal {
  id: string
  contractNumber: string
  vendor: string
  contractType: string
  currentEndDate: string
  renewalDate: string | null
  annualCost: number
  assetCount: number
  autoRenewal: boolean
  daysUntilRenewal: number | null
}

// API functions
async function getForecast(params?: {
  months?: number
  startDate?: string
  endDate?: string
}): Promise<ForecastResponse> {
  const searchParams = new URLSearchParams()
  if (params?.months) searchParams.append('months', params.months.toString())
  if (params?.startDate) searchParams.append('startDate', params.startDate)
  if (params?.endDate) searchParams.append('endDate', params.endDate)
  
  const response = await api.get(`/forecast?${searchParams.toString()}`)
  return response.data
}

async function getBillingGroupBreakdown(): Promise<{ breakdown: BillingGroupBreakdown[] }> {
  const response = await api.get('/forecast/billing-breakdown')
  return response.data
}

async function getUpcomingRenewals(months?: number): Promise<{ renewals: UpcomingRenewal[] }> {
  const searchParams = new URLSearchParams()
  if (months) searchParams.append('months', months.toString())
  
  const response = await api.get(`/forecast/upcoming-renewals?${searchParams.toString()}`)
  return response.data
}

// React Query hooks
export function useForecast(params?: {
  months?: number
  startDate?: string
  endDate?: string
}) {
  return useQuery({
    queryKey: ['forecast', params],
    queryFn: () => getForecast(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useBillingGroupBreakdown() {
  return useQuery({
    queryKey: ['forecast', 'billing-breakdown'],
    queryFn: getBillingGroupBreakdown,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useUpcomingRenewals(months: number = 12) {
  return useQuery({
    queryKey: ['forecast', 'upcoming-renewals', months],
    queryFn: () => getUpcomingRenewals(months),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}