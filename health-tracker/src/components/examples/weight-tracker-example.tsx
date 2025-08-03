// Example: Weight Tracker Component using the stores and hooks

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useHealthMetrics } from '@/hooks'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export function WeightTrackerExample() {
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const {
    recentWeight,
    weightChange,
    isLoading,
    addWeight,
  } = useHealthMetrics()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!weight) return
    
    await addWeight(parseFloat(weight), notes || undefined)
    setWeight('')
    setNotes('')
  }

  const getTrendIcon = () => {
    if (!weightChange) return null
    
    switch (weightChange.direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Weight Tracker</h3>
      
      {/* Current Weight Display */}
      {recentWeight && (
        <div className="mb-6 text-center">
          <div className="text-3xl font-bold">
            {recentWeight.weight.toFixed(1)} kg
          </div>
          {weightChange && (
            <div className="flex items-center justify-center gap-2 mt-2">
              {getTrendIcon()}
              <span className="text-sm text-muted-foreground">
                {weightChange.absolute > 0 ? '+' : ''}
                {weightChange.absolute.toFixed(1)} kg
                ({weightChange.percent.toFixed(1)}%)
              </span>
            </div>
          )}
          <div className="text-xs text-muted-foreground mt-1">
            Last recorded: {new Date(recentWeight.recordedAt).toLocaleDateString()}
          </div>
        </div>
      )}

      {/* Add New Weight Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="weight">Weight (kg)</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Enter weight"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="notes">Notes (optional)</Label>
          <Input
            id="notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about this measurement"
          />
        </div>
        
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !weight}
        >
          {isLoading ? 'Saving...' : 'Record Weight'}
        </Button>
      </form>
    </Card>
  )
}