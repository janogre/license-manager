import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/api/client'

// Types for report data
export interface InstallBaseReportItem {
  serialNumber: string
  hostname?: string
  model: string
  modelType: string
  location?: string
  status: string
  hasActiveContract: boolean
  contractCount: number
  purchaseDate?: string
}

export interface CoverageGapReportItem {
  serialNumber: string
  hostname?: string
  model: string
  modelType: string
  location?: string
  status: string
  purchaseDate?: string
  purchasePrice?: number
}

export interface CoverageGapSummary {
  totalAssets: number
  totalValue: number
}

export interface ContractCostItem {
  contractNumber: string
  vendor: string
  contractType: string
  annualCost?: number
  startDate: string
  endDate: string
  assetCount: number
}

export interface LicenseCostItem {
  softwareProduct: string
  licenseType: string
  quantity: number
  cost?: number
  expiryDate?: string
}

export interface CostAnalysisSummary {
  totalContractCost: number
  totalLicenseCost: number
  totalCost: number
  contractCount: number
  licenseCount: number
}

export interface CostAnalysisReport {
  contracts: ContractCostItem[]
  licenses: LicenseCostItem[]
  summary: CostAnalysisSummary
}

// Fetch Install Base Report
export function useInstallBaseReport() {
  return useQuery({
    queryKey: ['reports', 'install-base'],
    queryFn: async () => {
      const { data } = await api.get<{ report: InstallBaseReportItem[] }>('/reports/install-base')
      return data.report
    },
  })
}

// Fetch Coverage Gap Report
export function useCoverageGapReport() {
  return useQuery({
    queryKey: ['reports', 'coverage-gap'],
    queryFn: async () => {
      const { data } = await api.get<{ 
        report: CoverageGapReportItem[]
        summary: CoverageGapSummary 
      }>('/reports/coverage-gap')
      return data
    },
  })
}

// Fetch Cost Analysis Report
export function useCostAnalysisReport(year?: string) {
  return useQuery({
    queryKey: ['reports', 'cost-analysis', year],
    queryFn: async () => {
      const params = year ? { year } : {}
      const { data } = await api.get<{ report: CostAnalysisReport }>('/reports/cost', { params })
      return data.report
    },
  })
}

// Export report to different formats
export function useExportReport() {
  return useMutation({
    mutationFn: async ({ 
      reportType, 
      format, 
      data 
    }: { 
      reportType: string
      format: 'csv' | 'excel' | 'pdf'
      data: any
    }) => {
      // This would typically call a backend endpoint for export
      // For now, we'll create a simple CSV export client-side
      if (format === 'csv') {
        return exportToCSV(data, reportType)
      }
      throw new Error(`Export format ${format} not implemented yet`)
    },
  })
}

// Helper function to export data to CSV
function exportToCSV(data: any[], reportType: string) {
  if (!data || data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Handle values that might contain commas
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`
        }
        return value || ''
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${reportType}-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}