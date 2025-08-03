import { toast as sonnerToast } from 'sonner'

interface ToastProps {
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
  duration?: number
}

export function useToast() {
  const toast = ({ title, description, variant = 'default', duration }: ToastProps) => {
    const message = title || description || ''
    const options = {
      description: title ? description : undefined,
      duration,
    }

    switch (variant) {
      case 'destructive':
        sonnerToast.error(message, options)
        break
      case 'success':
        sonnerToast.success(message, options)
        break
      default:
        sonnerToast(message, options)
    }
  }

  return { toast }
}