import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 7 * 24 * 60 * 60 * 1000,
      networkMode: 'offlineFirst',
      retry: 1,
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
})
