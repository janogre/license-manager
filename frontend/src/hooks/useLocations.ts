import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';
import type {
  GetLocationsParams,
  GetLocationsResponse,
  Location,
} from '@/types';

// Fetch locations with pagination and filters
export function useLocations(params: GetLocationsParams = {}) {
  return useQuery({
    queryKey: ['locations', params],
    queryFn: async () => {
      const { data } = await api.get<GetLocationsResponse>('/locations', { params });
      return data;
    },
  });
}

// Fetch single location by ID
export function useLocation(id: string) {
  return useQuery({
    queryKey: ['locations', id],
    queryFn: async () => {
      const { data } = await api.get<Location>(`/locations/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// Create new location
export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Partial<Location>) => {
      const { data } = await api.post<Location>('/locations', input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}

// Update existing location
export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Location> & { id: string }) => {
      const { data } = await api.put<Location>(`/locations/${id}`, input);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['locations', data.id] });
    },
  });
}

// Delete location
export function useDeleteLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/locations/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}
