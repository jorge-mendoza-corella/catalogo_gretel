// define app states
import type { Contract } from '~~/types/use-contracts'

// export notifications state
export const useContracts = () => useState<Contract[]>('contract', () => ([]))
