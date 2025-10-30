import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'

// Types
export interface BillingGroup {
  id: string
  name: string
  description?: string
  billingType: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL' | 'CUSTOM'
  periodStart: string
  periodEnd: string
  isActive: boolean
  maxAssets?: number
  createdAt: string
  updatedAt: string
  _count: {
    assetMappings: number
  }
  assetMappings?: AssetBillingMapping[]
  invoiceRecords?: InvoiceRecord[]
  totals?: {
    totalAnnualCost: number
    totalAssetValue: number
    periodCost: number
    periodMultiplier: number
  }
}

export interface AssetBillingMapping {
  id: string
  assetId: string
  billingGroupId: string
  assignedDate: string
  effectiveFrom: string
  effectiveTo?: string
  assignedBy?: string
  notes?: string
  isActive: boolean
  asset: {
    id: string
    serialNumber: string
    hostname?: string
    model: {
      modelName: string
      manufacturer: string
    }
  }
  billingGroup: BillingGroup
}

export interface InvoiceRecord {
  id: string
  invoiceNumber: string
  billingGroupId: string
  vendor: string
  invoiceDate: string
  dueDate?: string
  totalAmount?: number
  currency: string
  status: 'DRAFT' | 'PENDING' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  paymentDate?: string
  paidAmount?: number
  notes?: string
  attachmentUrl?: string
  createdAt: string
  updatedAt: string
  billingGroup: BillingGroup
  lineItems: InvoiceLineItem[]
  _count: {
    lineItems: number
  }
}

export interface InvoiceLineItem {
  id: string
  invoiceId: string
  assetId?: string
  contractId?: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  billingPeriod?: string
}

export interface BillingAnalytics {
  billingGroups: {
    total: number
    active: number
  }
  assets: {
    total: number
    assigned: number
    unassigned: number
  }
  invoices: {
    count: number
    totalAmount: number
  }
  distribution: Array<{
    billingGroupId: string
    _count: {
      assetId: number
    }
  }>
}

export interface UnassignedAsset {
  id: string
  serialNumber: string
  hostname?: string
  assetTag?: string
  purchaseDate?: string
  purchasePrice?: number
  location?: string
  status: string
  owner?: string
  model: {
    id: string
    modelName: string
    manufacturer: string
    modelType: string
  }
  contracts: Array<{
    contract: {
      contractNumber: string
      annualCost?: number
    }
  }>
}

export interface InvoiceForecast {
  year: number
  totalGroups: number
  totalAssets: number
  totalEstimatedAmount: number
  forecast: Array<{
    billingGroup: {
      id: string
      name: string
      periodStart: string
      periodEnd: string
    }
    assetCount: number
    estimatedAmount: number
    currency: string
    assets: Array<{
      id: string
      serialNumber: string
      model: string
      estimatedCost: number
    }>
  }>
}

// API Functions
const billingApi = {
  // Billing Groups
  getBillingGroups: async (params?: { page?: number; limit?: number; isActive?: boolean }) => {
    const response = await apiClient.get('/billing/groups', { params })
    return response.data
  },

  getBillingGroupById: async (id: string) => {
    const response = await apiClient.get(`/billing/groups/${id}`)
    return response.data
  },

  createBillingGroup: async (data: Omit<BillingGroup, 'id' | 'createdAt' | 'updatedAt' | '_count'>) => {
    const response = await apiClient.post('/billing/groups', data)
    return response.data
  },

  updateBillingGroup: async (id: string, data: Partial<BillingGroup>) => {
    const response = await apiClient.put(`/billing/groups/${id}`, data)
    return response.data
  },

  deleteBillingGroup: async (id: string) => {
    const response = await apiClient.delete(`/billing/groups/${id}`)
    return response.data
  },

  // Asset Assignment
  assignAssetToBillingGroup: async (data: {
    assetId: string
    billingGroupId: string
    effectiveFrom?: string
    effectiveTo?: string
    notes?: string
  }) => {
    const response = await apiClient.post('/billing/assign-asset', data)
    return response.data
  },

  removeAssetFromBillingGroup: async (assetId: string, billingGroupId: string) => {
    const response = await apiClient.delete(`/billing/assign-asset/${assetId}/${billingGroupId}`)
    return response.data
  },

  // Invoice Records
  getInvoiceRecords: async (params?: { page?: number; limit?: number; billingGroupId?: string; status?: string }) => {
    const response = await apiClient.get('/billing/invoices', { params })
    return response.data
  },

  createInvoiceRecord: async (data: Omit<InvoiceRecord, 'id' | 'createdAt' | 'updatedAt' | 'billingGroup' | 'lineItems' | '_count'>) => {
    const response = await apiClient.post('/billing/invoices', data)
    return response.data
  },

  updateInvoiceRecord: async (id: string, data: Partial<InvoiceRecord>) => {
    const response = await apiClient.put(`/billing/invoices/${id}`, data)
    return response.data
  },

  // Analytics and Utilities
  getBillingAnalytics: async (year?: number) => {
    const response = await apiClient.get('/billing/analytics', { params: { year } })
    return response.data
  },

  getUnassignedAssets: async () => {
    const response = await apiClient.get('/billing/unassigned-assets')
    return response.data
  },

  getInvoiceForecast: async (year?: number) => {
    const response = await apiClient.get('/billing/forecast', { params: { year } })
    return response.data
  },

  balanceBillingGroups: async (billingGroupIds: string[], threshold?: number) => {
    const response = await apiClient.post('/billing/balance-groups', { billingGroupIds, threshold })
    return response.data
  }
}

// React Query Hooks

// Billing Groups
export const useBillingGroups = (params?: { page?: number; limit?: number; isActive?: boolean }) => {
  return useQuery({
    queryKey: ['billingGroups', params],
    queryFn: () => billingApi.getBillingGroups(params)
  })
}

export const useBillingGroup = (id: string) => {
  return useQuery({
    queryKey: ['billingGroup', id],
    queryFn: () => billingApi.getBillingGroupById(id),
    enabled: !!id
  })
}

export const useCreateBillingGroup = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: billingApi.createBillingGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billingGroups'] })
      queryClient.invalidateQueries({ queryKey: ['billingAnalytics'] })
    }
  })
}

export const useUpdateBillingGroup = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BillingGroup> }) => 
      billingApi.updateBillingGroup(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['billingGroups'] })
      queryClient.invalidateQueries({ queryKey: ['billingGroup', id] })
      queryClient.invalidateQueries({ queryKey: ['billingAnalytics'] })
    }
  })
}

export const useDeleteBillingGroup = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: billingApi.deleteBillingGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billingGroups'] })
      queryClient.invalidateQueries({ queryKey: ['billingAnalytics'] })
    }
  })
}

// Asset Assignment
export const useAssignAssetToBillingGroup = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: billingApi.assignAssetToBillingGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billingGroups'] })
      queryClient.invalidateQueries({ queryKey: ['billingAnalytics'] })
      queryClient.invalidateQueries({ queryKey: ['unassignedAssets'] })
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    }
  })
}

export const useRemoveAssetFromBillingGroup = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ assetId, billingGroupId }: { assetId: string; billingGroupId: string }) => 
      billingApi.removeAssetFromBillingGroup(assetId, billingGroupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billingGroups'] })
      queryClient.invalidateQueries({ queryKey: ['billingAnalytics'] })
      queryClient.invalidateQueries({ queryKey: ['unassignedAssets'] })
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    }
  })
}

// Invoice Records
export const useInvoiceRecords = (params?: { page?: number; limit?: number; billingGroupId?: string; status?: string }) => {
  return useQuery({
    queryKey: ['invoiceRecords', params],
    queryFn: () => billingApi.getInvoiceRecords(params)
  })
}

export const useCreateInvoiceRecord = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: billingApi.createInvoiceRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoiceRecords'] })
      queryClient.invalidateQueries({ queryKey: ['billingAnalytics'] })
    }
  })
}

export const useUpdateInvoiceRecord = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InvoiceRecord> }) => 
      billingApi.updateInvoiceRecord(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoiceRecords'] })
      queryClient.invalidateQueries({ queryKey: ['billingAnalytics'] })
    }
  })
}

// Analytics and Utilities
export const useBillingAnalytics = (year?: number) => {
  return useQuery({
    queryKey: ['billingAnalytics', year],
    queryFn: () => billingApi.getBillingAnalytics(year)
  })
}

export const useUnassignedAssets = () => {
  return useQuery({
    queryKey: ['unassignedAssets'],
    queryFn: billingApi.getUnassignedAssets
  })
}

export const useInvoiceForecast = (year?: number) => {
  return useQuery({
    queryKey: ['invoiceForecast', year],
    queryFn: () => billingApi.getInvoiceForecast(year)
  })
}

export const useBalanceBillingGroups = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ billingGroupIds, threshold }: { billingGroupIds: string[]; threshold?: number }) => 
      billingApi.balanceBillingGroups(billingGroupIds, threshold),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billingGroups'] })
      queryClient.invalidateQueries({ queryKey: ['billingAnalytics'] })
    }
  })
}