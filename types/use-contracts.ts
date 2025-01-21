export interface Contract {
  uid: string | null
  name: string
  type: string
  status: string
  template_id: string
  project: {
    id: string
    name: string
  }
  seller: {
    id: string
    name: string
  }
  texts: Array<{
    tag: string
    label: string
  }>
  lists: Array<{
    tag: string
    label: string
  }>
  images: Array<{
    tag: string
    label: string
  }>
}
