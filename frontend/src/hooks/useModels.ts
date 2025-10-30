import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import type { GetModelsParams, GetModelsResponse, HardwareModel, CreateHardwareModelRequest, UpdateHardwareModelRequest } from '@/types'

// Fetch hardware models with pagination and filters
export function useModels(params: GetModelsParams = {}) {
  return useQuery({
    queryKey: ['models', params],
    queryFn: async () => {
      const { data } = await api.get<{ models: HardwareModel[] }>('/models', { params })
      return { models: data.models, pagination: { total: data.models.length, page: 1, limit: 100, pages: 1 } }
    },
  })
}

// Fetch single model by ID
export function useModel(id: string) {
  return useQuery({
    queryKey: ['models', id],
    queryFn: async () => {
      const { data } = await api.get<{ model: HardwareModel }>(`/models/${id}`)
      return data.model
    },
    enabled: !!id,
  })
}

// Fetch all models (for dropdowns) - no pagination
export function useAllModels() {
  return useQuery({
    queryKey: ['models', 'all'],
    queryFn: async () => {
      const { data } = await api.get<{ models: HardwareModel[] }>('/models', {
        params: { limit: 1000 }, // Get all models
      })
      return data.models
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}

// Create a new hardware model
export function useCreateModel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (modelData: CreateHardwareModelRequest) => {
      const { data } = await api.post<{ model: HardwareModel }>('/models', modelData)
      return data.model
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] })
    },
  })
}

// Update an existing hardware model
export function useUpdateModel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateHardwareModelRequest }) => {
      const response = await api.put<{ model: HardwareModel }>(`/models/${id}`, data)
      return response.data.model
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['models'] })
      queryClient.invalidateQueries({ queryKey: ['models', variables.id] })
    },
  })
}

// Delete a hardware model
export function useDeleteModel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/models/${id}`)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] })
    },
  })
}
