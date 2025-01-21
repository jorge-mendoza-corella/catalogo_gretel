export interface Project {
  data: Array<{
    project_id: number
    project_name: string
    sellers: Array<{
      seller_id: number
      seller_name: string
    }>
  }
    >
}
