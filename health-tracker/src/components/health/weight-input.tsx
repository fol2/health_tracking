'use client'

import { useState, useEffect } from 'react'
import { Plus, Calendar, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useHealthMetricsStore } from '@/store/health-metrics-store'
import { useUserProfileStore } from '@/store/user-profile-store'
import { convertWeight, WeightUnits, type WeightUnit } from '@/lib/utils/health-calculations'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface WeightInputProps {
  onSuccess?: () => void
  compact?: boolean
}

export function WeightInput({ onSuccess, compact = false }: WeightInputProps) {
  const { addWeightRecord, isLoading } = useHealthMetricsStore()
  const { profile } = useUserProfileStore()
  
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16))
  const [unit, setUnit] = useState<WeightUnit>(
    profile?.unitsPreference === 'imperial' ? WeightUnits.LBS : WeightUnits.KG
  )
  const [isExpanded, setIsExpanded] = useState(!compact)

  useEffect(() => {
    if (profile?.unitsPreference) {
      setUnit(profile.unitsPreference === 'imperial' ? WeightUnits.LBS : WeightUnits.KG)
    }
  }, [profile?.unitsPreference])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!weight || parseFloat(weight) <= 0) {
      toast.error('Please enter a valid weight')
      return
    }

    try {
      // Convert to kg for storage
      const weightValue = parseFloat(weight)
      const weightKg = unit === WeightUnits.KG 
        ? weightValue 
        : convertWeight(weightValue, unit, WeightUnits.KG)

      await addWeightRecord(weightKg, notes || undefined)
      
      // Reset form
      setWeight('')
      setNotes('')
      setDate(new Date().toISOString().slice(0, 16))
      if (compact) setIsExpanded(false)
      
      toast.success('Weight recorded successfully')
      onSuccess?.()
    } catch (error) {
      toast.error('Failed to record weight')
    }
  }

  const toggleUnit = () => {
    const newUnit = unit === WeightUnits.KG ? WeightUnits.LBS : WeightUnits.KG
    if (weight) {
      const convertedWeight = convertWeight(parseFloat(weight), unit, newUnit)
      setWeight(convertedWeight.toFixed(1))
    }
    setUnit(newUnit)
  }

  if (compact && !isExpanded) {
    return (
      <Button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>
    )
  }

  return (
    <Card className={cn(
      "p-4",
      compact && "fixed bottom-20 right-4 w-80 shadow-lg"
    )}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Record Weight
          </h3>
          {compact && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
            >
              ✕
            </Button>
          )}
        </div>

        <div className="grid gap-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="weight">Weight</Label>
              <div className="flex gap-2">
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder={`Enter weight in ${unit}`}
                  required
                  autoFocus
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={toggleUnit}
                  className="px-3"
                >
                  {unit}
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date & Time
            </Label>
            <Input
              id="date"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().slice(0, 16)}
              required
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., before breakfast, after workout..."
              rows={2}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !weight}
        >
          {isLoading ? 'Recording...' : 'Record Weight'}
        </Button>
      </form>
    </Card>
  )
}