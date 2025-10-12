import { useEffect, useCallback } from 'react'
import { UseFormWatch, UseFormSetValue, FieldValues, Path } from 'react-hook-form'

interface UseFormPersistenceOptions<T extends FieldValues> {
  watch: UseFormWatch<T>
  setValue: UseFormSetValue<T>
  storageKey: string
  excludeFields?: (keyof T)[]
  expirationHours?: number
}

interface StoredFormData<T> {
  data: Partial<T>
  timestamp: number
}

/**
 * Custom hook to persist form data to localStorage
 * Automatically saves form values as they change and restores them on mount
 * 
 * @param watch - React Hook Form watch function
 * @param setValue - React Hook Form setValue function
 * @param storageKey - Unique key for localStorage
 * @param excludeFields - Fields to exclude from persistence (e.g., passwords)
 * @param expirationHours - Hours until stored data expires (default: 24)
 */
export function useFormPersistence<T extends FieldValues>({
  watch,
  setValue,
  storageKey,
  excludeFields = [],
  expirationHours = 24,
}: UseFormPersistenceOptions<T>) {
  // Load saved data on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (!stored) return

      const { data, timestamp }: StoredFormData<T> = JSON.parse(stored)
      
      // Check if data has expired
      const now = Date.now()
      const expirationMs = expirationHours * 60 * 60 * 1000
      if (now - timestamp > expirationMs) {
        localStorage.removeItem(storageKey)
        return
      }

      // Restore form values
      Object.entries(data).forEach(([key, value]) => {
        if (!excludeFields.includes(key as keyof T)) {
          setValue(key as Path<T>, value as any, { shouldValidate: false })
        }
      })
    } catch (error) {
      console.error('Error loading form data from localStorage:', error)
      localStorage.removeItem(storageKey)
    }
  }, [storageKey, setValue, excludeFields, expirationHours])

  // Save form data to localStorage when it changes
  useEffect(() => {
    const subscription = watch((formData) => {
      try {
        // Filter out excluded fields
        const dataToStore = Object.entries(formData).reduce((acc, [key, value]) => {
          if (!excludeFields.includes(key as keyof T)) {
            acc[key as keyof T] = value as any
          }
          return acc
        }, {} as Partial<T>)

        const storageData: StoredFormData<T> = {
          data: dataToStore,
          timestamp: Date.now(),
        }

        localStorage.setItem(storageKey, JSON.stringify(storageData))
      } catch (error) {
        console.error('Error saving form data to localStorage:', error)
      }
    })

    return () => subscription.unsubscribe()
  }, [watch, storageKey, excludeFields])

  // Function to manually clear stored data
  const clearStoredData = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
    } catch (error) {
      console.error('Error clearing stored form data:', error)
    }
  }, [storageKey])

  return { clearStoredData }
}

