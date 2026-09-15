export function formatMileage(miles: number): string {
  return `${miles.toLocaleString('en-IN')} km`
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}
