import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import type {
  GetContractsParams,
  GetContractsResponse,
  MaintenanceContract,
} from '@/types'

// Fetch contracts with pagination and filters
export function useContracts(params: GetContractsParams = {}) {
  return useQuery({
    queryKey: ['contracts', params],
    queryFn: async () => {
      const { data } = await api.get<GetContractsResponse>('/contracts', { params })
      return data
    },
  })
}

// Fetch single contract by ID
export function useContract(id: string) {
  return useQuery({
    queryKey: ['contracts', id],
    queryFn: async () => {
      const { data } = await api.get<MaintenanceContract>(`/contracts/${id}`)
      return data
    },
    enabled: !!id,
  })
}

// Create new contract
export function useCreateContract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: Partial<MaintenanceContract>) => {
      const { data } = await api.post<MaintenanceContract>('/contracts', input)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
    },
  })
}

// Update existing contract
export function useUpdateContract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<MaintenanceContract> & { id: string }) => {
      const { data } = await api.put<MaintenanceContract>(`/contracts/${id}`, input)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['contracts', data.id] })
    },
  })
}

// Delete contract
export function useDeleteContract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/contracts/${id}`)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
    },
  })
}
