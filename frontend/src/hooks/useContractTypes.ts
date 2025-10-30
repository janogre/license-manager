import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { 
  ContractTypeManagement, 
  CreateContractTypeInput, 
  UpdateContractTypeInput 
} from '@/types'

// API functions
async function getContractTypes(params?: { isActive?: boolean }): Promise<{ contractTypes: ContractTypeManagement[] }> {
  const searchParams = new URLSearchParams()
  if (params?.isActive !== undefined) {
    searchParams.append('isActive', params.isActive.toString())
  }
  
  const response = await api.get(`/contract-types?${searchParams.toString()}`)
  return response.data
}

async function getContractTypeById(id: string): Promise<{ contractType: ContractTypeManagement }> {
  const response = await api.get(`/contract-types/${id}`)
  return response.data
}

async function createContractType(data: CreateContractTypeInput): Promise<{ contractType: ContractTypeManagement }> {
  const response = await api.post('/contract-types', data)
  return response.data
}

async function updateContractType(id: string, data: UpdateContractTypeInput): Promise<{ contractType: ContractTypeManagement }> {
  const response = await api.put(`/contract-types/${id}`, data)
  return response.data
}

async function deleteContractType(id: string): Promise<{ message: string; contractType: ContractTypeManagement }> {
  const response = await api.delete(`/contract-types/${id}`)
  return response.data
}

async function activateContractType(id: string): Promise<{ contractType: ContractTypeManagement }> {
  const response = await api.put(`/contract-types/${id}/activate`)
  return response.data
}

async function setDefaultContractType(id: string): Promise<{ contractType: ContractTypeManagement }> {
  const response = await api.put(`/contract-types/${id}/set-default`)
  return response.data
}

// React Query hooks
export function useContractTypes(params?: { isActive?: boolean }) {
  return useQuery({
    queryKey: ['contractTypes', params],
    queryFn: () => getContractTypes(params),
  })
}

export function useContractType(id: string) {
  return useQuery({
    queryKey: ['contractType', id],
    queryFn: () => getContractTypeById(id),
    enabled: !!id,
  })
}

export function useCreateContractType() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createContractType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractTypes'] })
    },
  })
}

export function useUpdateContractType() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdateContractTypeInput) => 
      updateContractType(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contractTypes'] })
      queryClient.invalidateQueries({ queryKey: ['contractType', variables.id] })
    },
  })
}

export function useDeleteContractType() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteContractType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractTypes'] })
    },
  })
}

export function useActivateContractType() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: activateContractType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractTypes'] })
    },
  })
}

export function useSetDefaultContractType() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: setDefaultContractType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractTypes'] })
    },
  })
}