// Placeholder - will use @tanstack/react-query when installed
// export function useBikes() { return useQuery({ queryKey: ['bikes'], queryFn: bikesApi.list }) }
export function useBikes() {
  return { data: [], isLoading: false }
}
