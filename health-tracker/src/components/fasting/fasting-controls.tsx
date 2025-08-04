'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useFastingSessionStore } from '@/store'
import { Clock, Calendar, Coffee, Utensils } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface FastingType {
  id: string
  name: string
  hours: number
  description: string
  icon: React.ReactNode
}

const FASTING_TYPES: FastingType[] = [
  {
    id: '16:8',
    name: '16:8',
    hours: 16,
    description: 'Daily intermittent fasting',
    icon: <Coffee className="h-5 w-5" />,
  },
  {
    id: '18:6',
    name: '18:6',
    hours: 18,
    description: 'Extended daily fast',
    icon: <Clock className="h-5 w-5" />,
  },
  {
    id: '24h',
    name: '24 Hour',
    hours: 24,
    description: 'One meal a day (OMAD)',
    icon: <Utensils className="h-5 w-5" />,
  },
  {
    id: '48h',
    name: '48 Hour',
    hours: 48,
    description: 'Two day fast',
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    id: '72h',
    name: '72 Hour',
    hours: 72,
    description: 'Three day fast',
    icon: <Calendar className="h-5 w-5" />,
  },
]

export function FastingControls() {
  const { activeSession, startSession, isLoading } = useFastingSessionStore()
  const [selectedType, setSelectedType] = useState<string>('')
  const [customHours, setCustomHours] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [isStarting, setIsStarting] = useState(false)
  
  // Initialize with current date/time
  const now = new Date()
  const [startDate, setStartDate] = useState<string>(format(now, 'yyyy-MM-dd'))
  const [startTime, setStartTime] = useState<string>(format(now, 'HH:mm'))

  const handleStartFast = async () => {
    if (!selectedType && !customHours) {
      toast.error('Please select a fasting type or enter custom hours')
      return
    }

    setIsStarting(true)
    try {
      const type = selectedType || 'custom'
      const hours = selectedType 
        ? FASTING_TYPES.find(t => t.id === selectedType)?.hours || 0
        : parseInt(customHours)

      if (hours <= 0) {
        toast.error('Please enter a valid duration')
        return
      }

      // Combine date and time
      const startDateTime = new Date(`${startDate}T${startTime}`)
      
      await startSession({
        type,
        targetHours: hours,
        notes: notes.trim() || undefined,
        startTime: startDateTime,
      })

      // Reset form
      setSelectedType('')
      setCustomHours('')
      setNotes('')
      
      toast.success('Fasting session started!')
    } catch (error) {
      toast.error('Failed to start fasting session')
    } finally {
      setIsStarting(false)
    }
  }

  // Don't show controls if there's an active session
  if (activeSession) {
    return null
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Start a Fast</h2>
      
      {/* Quick Start Options */}
      <div className="space-y-4">
        <div>
          <Label className="text-base mb-3 block">Quick Start</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {FASTING_TYPES.map((type) => (
              <Button
                key={type.id}
                variant={selectedType === type.id ? 'default' : 'outline'}
                className="h-auto py-4 px-3 flex-col space-y-2"
                onClick={() => {
                  setSelectedType(type.id)
                  setCustomHours('')
                }}
                disabled={isLoading || isStarting}
              >
                <div className="flex items-center gap-2">
                  {type.icon}
                  <span className="font-semibold">{type.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {type.description}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Duration */}
        <div className="space-y-2">
          <Label htmlFor="custom-hours">Custom Duration (hours)</Label>
          <Input
            id="custom-hours"
            type="number"
            min="1"
            max="168"
            placeholder="Enter custom hours"
            value={customHours}
            onChange={(e) => {
              setCustomHours(e.target.value)
              setSelectedType('')
            }}
            disabled={isLoading || isStarting}
          />
        </div>

        {/* Start Date/Time */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isLoading || isStarting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="start-time">Start Time</Label>
            <Input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={isLoading || isStarting}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            placeholder="Add any notes about this fasting session..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isLoading || isStarting}
            rows={3}
          />
        </div>

        {/* Start Button */}
        <Button
          size="lg"
          className="w-full"
          onClick={handleStartFast}
          disabled={isLoading || isStarting || (!selectedType && !customHours)}
        >
          {isStarting ? 'Starting...' : 'Start Fasting'}
        </Button>
      </div>
    </Card>
  )
}