import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'

import { AuthProvider } from '@/features/auth'
import { queryClient } from '@/shared/lib/query-client'
import { Toaster } from '@/shared/ui/sonner'

import { router } from './router'

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  )
}
