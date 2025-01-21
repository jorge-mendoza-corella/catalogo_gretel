// define app states
import type { Notification } from '@/types/use-notification'

// export notifications state
export function useNotification() {
  return useState<Notification>('notification', () => ({
    show: false,
    severity: 'info',
    summary: '',
    detail: '',
    life: 3000,
  }))
}
