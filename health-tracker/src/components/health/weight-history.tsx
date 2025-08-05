'use client'

import { useState, useEffect } from 'react'
import { Trash2, Edit2, TrendingUp, TrendingDown, Minus, Filter, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useHealthMetricsStore } from '@/store/health-metrics-store'
import { useUserProfileStore } from '@/store/user-profile-store'
import { 
  convertWeight, 
  WeightUnits, 
  type WeightUnit,
  formatWeight,
  formatHealthDate,
  calculateWeightChange
} from '@/lib/utils/health-calculations'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { WeightRecord } from '@/types/database'

export function WeightHistory() {
  const { 
    weightHistory, 
    fetchWeightHistory, 
    updateWeightRecord, 
    deleteWeightRecord,
    isLoading 
  } = useHealthMetricsStore()
  const { profile } = useUserProfileStore()
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editWeight, setEditWeight] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editDate, setEditDate] = useState('')
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month' | 'year'>('all')
  const [unit, setUnit] = useState<WeightUnit>(
    profile?.unitsPreference === 'imperial' ? WeightUnits.LBS : WeightUnits.KG
  )

  // Get local datetime string for input element
  const getLocalDateTimeString = (date: Date | string) => {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  useEffect(() => {
    fetchWeightHistory(50)
  }, [fetchWeightHistory])

  useEffect(() => {
    if (profile?.unitsPreference) {
      setUnit(profile.unitsPreference === 'imperial' ? WeightUnits.LBS : WeightUnits.KG)
    }
  }, [profile?.unitsPreference])

  const handleEdit = (record: WeightRecord) => {
    setEditingId(record.id)
    const displayWeight = unit === WeightUnits.KG 
      ? record.weight 
      : convertWeight(record.weight, WeightUnits.KG, unit)
    setEditWeight(displayWeight.toFixed(1))
    setEditNotes(record.notes || '')
    setEditDate(getLocalDateTimeString(record.recordedAt))
  }

  const handleUpdate = async () => {
    if (!editingId || !editWeight) return

    try {
      const weightKg = unit === WeightUnits.KG 
        ? parseFloat(editWeight)
        : convertWeight(parseFloat(editWeight), unit, WeightUnits.KG)

      await updateWeightRecord(editingId, weightKg, editNotes, new Date(editDate))
      setEditingId(null)
      setEditWeight('')
      setEditNotes('')
      setEditDate('')
      toast.success('Weight updated successfully')
    } catch (error) {
      toast.error('Failed to update weight')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this weight record?')) return

    try {
      await deleteWeightRecord(id)
      toast.success('Weight record deleted')
    } catch (error) {
      toast.error('Failed to delete weight record')
    }
  }

  const getFilteredHistory = () => {
    if (dateFilter === 'all') return weightHistory

    const now = new Date()
    const filterDate = new Date()

    switch (dateFilter) {
      case 'week':
        filterDate.setDate(now.getDate() - 7)
        break
      case 'month':
        filterDate.setMonth(now.getMonth() - 1)
        break
      case 'year':
        filterDate.setFullYear(now.getFullYear() - 1)
        break
    }

    return weightHistory.filter(record => 
      new Date(record.recordedAt) >= filterDate
    )
  }

  const getWeightChange = (record: WeightRecord, previousRecord?: WeightRecord) => {
    if (!previousRecord) return null
    return calculateWeightChange(record.weight, previousRecord.weight)
  }

  const getTrendIcon = (change: ReturnType<typeof getWeightChange>) => {
    if (!change) return null

    switch (change.direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const filteredHistory = getFilteredHistory()

  if (isLoading && weightHistory.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          Loading weight history...
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Weight History</h3>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
            className="text-sm border rounded-md px-2 py-1 bg-background"
          >
            <option value="all">All time</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last month</option>
            <option value="year">Last year</option>
          </select>
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          No weight records found. Start tracking your weight!
        </div>
      ) : (
        <div className="space-y-2">
          {filteredHistory.map((record, index) => {
            const previousRecord = filteredHistory[index + 1]
            const change = getWeightChange(record, previousRecord)
            const displayWeight = unit === WeightUnits.KG 
              ? record.weight 
              : convertWeight(record.weight, WeightUnits.KG, unit)

            if (editingId === record.id) {
              return (
                <div key={record.id} className="p-3 border rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Weight ({unit})</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={editWeight}
                        onChange={(e) => setEditWeight(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div>
                      <Label>Date & Time</Label>
                      <Input
                        type="datetime-local"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        max={getLocalDateTimeString(new Date())}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Input
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Optional notes"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleUpdate}
                      disabled={isLoading}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(null)
                        setEditWeight('')
                        setEditNotes('')
                        setEditDate('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )
            }

            return (
              <div
                key={record.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg",
                  "hover:bg-muted/50 transition-colors",
                  index === 0 && "bg-muted/30"
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-lg">
                      {formatWeight(displayWeight, unit)}
                    </span>
                    {change && (
                      <div className="flex items-center gap-1">
                        {getTrendIcon(change)}
                        <span className="text-sm text-muted-foreground">
                          {change.direction !== 'same' && (
                            <>
                              {change.direction === 'up' ? '+' : '-'}
                              {formatWeight(convertWeight(change.absolute, WeightUnits.KG, unit), unit, 1)}
                            </>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatHealthDate(record.recordedAt)}
                    {record.notes && (
                      <span className="ml-2 italic">• {record.notes}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(record)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(record.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}