import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import type { GetModelsParams, GetModelsResponse, HardwareModel } from '@/types'

// Fetch hardware models with pagination and filters
export function useModels(params: GetModelsParams = {}) {
  return useQuery({
    queryKey: ['models', params],
    queryFn: async () => {
      const { data } = await api.get<GetModelsResponse>('/models', { params })
      return data
    },
  })
}

// Fetch single model by ID
export function useModel(id: string) {
  return useQuery({
    queryKey: ['models', id],
    queryFn: async () => {
      const { data } = await api.get<HardwareModel>(`/models/${id}`)
      return data
    },
    enabled: !!id,
  })
}

// Fetch all models (for dropdowns) - no pagination
export function useAllModels() {
  return useQuery({
    queryKey: ['models', 'all'],
    queryFn: async () => {
      const { data } = await api.get<GetModelsResponse>('/models', {
        params: { limit: 1000 }, // Get all models
      })
      return data.models
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}
