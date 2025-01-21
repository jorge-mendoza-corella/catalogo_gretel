// define app states
import type { Tag } from '~~/types/use-tag'

// export notifications state
export const useTags = () => useState<Tag[]>('tag', () => ([]))
