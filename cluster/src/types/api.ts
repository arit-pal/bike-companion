export type ApiResponse<T> = {
  data: T
  message?: string
}

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export type ApiError = {
  message: string
  status: number
  details?: unknown
}
