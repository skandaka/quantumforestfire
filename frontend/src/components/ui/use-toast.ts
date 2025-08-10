// Minimal toast hook placeholder to satisfy imports and provide basic console feedback.
// Replace with a full-featured implementation or a library like react-hot-toast.
import { useCallback } from 'react'

export interface ToastOptions { title?: string; description?: string; variant?: 'default' | 'destructive'; duration?: number }

export const useToast = () => {
  const toast = useCallback((opts: ToastOptions) => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[toast]', opts.title || opts.description || '', opts)
    }
  }, [])
  return { toast }
}
