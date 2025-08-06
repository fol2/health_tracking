'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useFastingSessionStore } from '@/store'
import { useDateTimeInput } from '@/hooks/use-datetime-input'
import { toast } from 'sonner'
import { CalendarIcon, Clock } from 'lucide-react'

interface EditStartTimeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentStartTime: Date
}

export function EditStartTimeDialog({
  open,
  onOpenChange,
  currentStartTime,
}: EditStartTimeDialogProps) {
  const { updateStartTime } = useFastingSessionStore()
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Use custom hook for date/time management
  const datetime = useDateTimeInput({
    initialDate: currentStartTime,
    maxDate: new Date(), // Cannot be in the future
  })

  const handleUpdate = async () => {
    if (!datetime.isValid || !datetime.dateTime) {
      toast.error('Please enter a valid date and time')
      return
    }
    
    setIsUpdating(true)
    
    try {
      await updateStartTime(datetime.dateTime)
      toast.success('Fasting start time updated successfully')
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to update start time')
      console.error('Failed to update start time:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Fasting Start Time</DialogTitle>
          <DialogDescription>
            Adjust the start time of your current fasting session to be more accurate.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="date" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Date
            </Label>
            <Input
              id="date"
              {...datetime.dateInputProps}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time
            </Label>
            <Input
              id="time"
              {...datetime.timeInputProps}
            />
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>Current: {format(currentStartTime, 'PPp')}</p>
            <p className={!datetime.isValid ? 'text-destructive' : ''}>
              New: {datetime.formatted}
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={isUpdating || !datetime.isValid}
          >
            {isUpdating ? 'Updating...' : 'Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}