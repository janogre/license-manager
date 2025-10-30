import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import type {
  GetAssetsParams,
  GetAssetsResponse,
  HardwareAsset,
  CreateAssetInput,
  UpdateAssetInput,
} from '@/types'

// Fetch assets with pagination and filters
export function useAssets(params: GetAssetsParams = {}) {
  return useQuery({
    queryKey: ['assets', params],
    queryFn: async () => {
      const { data } = await api.get<GetAssetsResponse>('/assets', { params })
      return data
    },
  })
}

// Fetch single asset by ID
export function useAsset(id: string) {
  return useQuery({
    queryKey: ['assets', id],
    queryFn: async () => {
      const { data } = await api.get<{ asset: HardwareAsset }>(`/assets/${id}`)
      return data.asset
    },
    enabled: !!id,
  })
}

// Create new asset
export function useCreateAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateAssetInput) => {
      const { data } = await api.post<{ asset: HardwareAsset }>('/assets', input)
      return data.asset
    },
    onSuccess: () => {
      // Invalidate and refetch assets list
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    },
  })
}

// Update existing asset
export function useUpdateAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateAssetInput) => {
      const { data } = await api.put<{ asset: HardwareAsset }>(`/assets/${id}`, input)
      return data.asset
    },
    onSuccess: (data) => {
      // Invalidate assets list and specific asset
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['assets', data.id] })
    },
  })
}

// Delete asset
export function useDeleteAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/assets/${id}`)
      return id
    },
    onSuccess: () => {
      // Invalidate assets list
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    },
  })
}

// Export asset data
export function useExportAssets() {
  return useMutation({
    mutationFn: async (params: GetAssetsParams = {}) => {
      const { data } = await api.get('/assets/export', {
        params,
        responseType: 'blob',
      })
      return data
    },
  })
}
