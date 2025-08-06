import { useState, useMemo } from 'react'
import { format } from 'date-fns'

export interface UseDateTimeInputOptions {
  initialDate?: Date
  maxDate?: Date
  minDate?: Date
}

/**
 * Custom hook for managing date and time inputs
 * Provides validation and formatted values
 */
export function useDateTimeInput(options: UseDateTimeInputOptions = {}) {
  const { 
    initialDate = new Date(), 
    maxDate = new Date(),
    minDate
  } = options

  const [date, setDate] = useState(() => 
    format(initialDate, 'yyyy-MM-dd')
  )
  
  const [time, setTime] = useState(() => 
    format(initialDate, 'HH:mm')
  )

  const dateTime = useMemo(() => {
    try {
      return new Date(`${date}T${time}`)
    } catch {
      return null
    }
  }, [date, time])

  const isValid = useMemo(() => {
    if (!dateTime || isNaN(dateTime.getTime())) return false
    if (maxDate && dateTime > maxDate) return false
    if (minDate && dateTime < minDate) return false
    return true
  }, [dateTime, maxDate, minDate])

  const reset = () => {
    setDate(format(initialDate, 'yyyy-MM-dd'))
    setTime(format(initialDate, 'HH:mm'))
  }

  return {
    date,
    time,
    dateTime,
    isValid,
    setDate,
    setTime,
    reset,
    // Formatted values for display
    formatted: dateTime && isValid ? format(dateTime, 'PPp') : 'Invalid date/time',
    // Input props for convenience
    dateInputProps: {
      type: 'date' as const,
      value: date,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value),
      max: maxDate ? format(maxDate, 'yyyy-MM-dd') : undefined,
      min: minDate ? format(minDate, 'yyyy-MM-dd') : undefined,
    },
    timeInputProps: {
      type: 'time' as const,
      value: time,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setTime(e.target.value),
    },
  }
}