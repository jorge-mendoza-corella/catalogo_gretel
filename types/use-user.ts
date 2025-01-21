export interface User {
  uid: string | null
  name: string | null
  email: string | null
  photo: string | null
  internal: boolean | null
  admin: boolean | null
  contracts: boolean | null
  landings: boolean | null
  deliveries: boolean | null
  credits: boolean | null
}
