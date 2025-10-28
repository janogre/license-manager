import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import type {
  GetLicensesParams,
  GetLicensesResponse,
  License,
} from '@/types'

// Fetch licenses with pagination and filters
export function useLicenses(params: GetLicensesParams = {}) {
  return useQuery({
    queryKey: ['licenses', params],
    queryFn: async () => {
      const { data } = await api.get<GetLicensesResponse>('/licenses', { params })
      return data
    },
  })
}

// Fetch single license by ID
export function useLicense(id: string) {
  return useQuery({
    queryKey: ['licenses', id],
    queryFn: async () => {
      const { data } = await api.get<License>(`/licenses/${id}`)
      return data
    },
    enabled: !!id,
  })
}

// Create new license
export function useCreateLicense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: Partial<License>) => {
      const { data } = await api.post<License>('/licenses', input)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenses'] })
    },
  })
}

// Update existing license
export function useUpdateLicense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<License> & { id: string }) => {
      const { data } = await api.put<License>(`/licenses/${id}`, input)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['licenses'] })
      queryClient.invalidateQueries({ queryKey: ['licenses', data.id] })
    },
  })
}

// Delete license
export function useDeleteLicense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/licenses/${id}`)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenses'] })
    },
  })
}
