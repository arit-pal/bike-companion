import { useState } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  const setStoredValue = (next: T) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(next))
      setValue(next)
    } catch (err) {
      console.error(err)
    }
  }

  return [value, setStoredValue] as const
}
