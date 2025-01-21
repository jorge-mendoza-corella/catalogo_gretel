// define app states
import type { User } from '@/types/use-user'

// export user state
export function useUser() {
  return useState<User>('user', () => ({
    uid: null,
    name: null,
    email: null,
    photo: null,
    internal: null,
    admin: null,
    contracts: null,
    landings: null,
    deliveries: null,
    credits: null,
  }))
}
